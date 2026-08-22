#!/usr/bin/env node
/**
 * CreatiHub Website Monitor
 * --------------------------
 * Runs on a schedule (via GitHub Actions) and checks that creatihub.com.ng is
 * healthy. If anything is wrong, the script exits with a non-zero code, which
 * GitHub Actions turns into a failed run — and you get an email notification
 * automatically (GitHub emails the repo owner on every failed Actions run).
 *
 * What it checks:
 *   1. Every public page returns HTTP 200
 *   2. No page is stuck on "Loading…" (looks for real content)
 *   3. Every inline <script> block has valid JavaScript (catches the exact
 *      "missing ) after argument list" bug that froze the order page)
 *   4. Key public API endpoints respond correctly
 *   5. SSL certificate is not expiring within 14 days
 *   6. The Ninja health-monitor endpoint responds
 *
 * No external dependencies — uses only Node.js built-ins (https, tls, vm).
 */

const https = require('https');
const tls = require('tls');
const vm = require('vm');

// ─── Configuration ───────────────────────────────────────────────────────────
const SITE = process.env.SITE_URL || 'https://creatihub.com.ng';

// Pages to check. Each entry has a URL and a "proof" keyword that ONLY appears
// when the page has loaded its real content (not when stuck on "Loading…").
const PAGES = [
  { path: '/',                 proof: 'CreatiHub',          desc: 'Homepage' },
  { path: '/services',         proof: 'Services',           desc: 'Services listing' },
  { path: '/order?service=logo-design', proof: 'Choose your package', desc: 'Order page (logo-design)' },
  { path: '/order?service=flyer-design', proof: 'Choose your package', desc: 'Order page (flyer-design)' },
  { path: '/order?service=website-design', proof: 'Choose your package', desc: 'Order page (website-design)' },
  { path: '/auth',             proof: 'Join CreatiHub',     desc: 'Auth/login page' },
  { path: '/auth?mode=register', proof: 'Join CreatiHub',   desc: 'Register page' },
  { path: '/training',         proof: 'Training',           desc: 'Training listing' },
  { path: '/learn',            proof: 'Learn',              desc: 'Learn page' },
  { path: '/dashboard',        proof: 'dashboard',          desc: 'Dashboard (may redirect — ok if 200/302)' },
  { path: '/payment/callback', proof: '',                   desc: 'Payment callback (may redirect)', allowRedirect: true },
];

// Public API endpoints to check (no auth required).
// These return objects with a named array property (e.g. {services: [...]}),
// so we check for the presence of that key.
const API_ENDPOINTS = [
  { path: '/api/services',     expectKey: 'services',  desc: 'Services list' },
  { path: '/api/tracks',       expectKey: 'tracks',    desc: 'Training tracks' },
  { path: '/api/training',     expectKey: 'programs',  desc: 'Training programs' },
  { path: '/api/config',       expectKey: null,        desc: 'Public site config (object)' },
  { path: '/health',           expectKey: null,        desc: 'Health endpoint (object)' },
  { path: '/__ninja/health',   expectKey: null,        desc: 'Ninja health-monitor endpoint (object)' },
];

// ── Static asset checks (JS files that every page depends on) ──────────
const STATIC_ASSETS = [
  { path: '/js/sentry-config.js', proof: 'SENTRY_CONFIG', desc: 'Sentry error-tracking config' },
  { path: '/js/app.js',           proof: '',              desc: 'Main app JS (non-empty)' },
  { path: '/css/style.css',       proof: '',              desc: 'Stylesheet (non-empty)' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetch a URL and return { status, body, headers, finalUrl }.
 * Follows redirects up to 5 hops.
 */
function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const maxRedirects = opts.maxRedirects || 5;
    let redirects = 0;

    const doRequest = (target) => {
      const req = https.get(target, { timeout: 30000, headers: { 'User-Agent': 'CreatiHub-Monitor/1.0' } }, (res) => {
        // Handle redirects
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          if (redirects >= maxRedirects) {
            resolve({ status: res.statusCode, body: '', headers: res.headers, finalUrl: target, redirected: true });
            return;
          }
          redirects++;
          let next = res.headers.location;
          if (next.startsWith('/')) {
            const u = new URL(target);
            next = `${u.protocol}//${u.host}${next}`;
          }
          res.resume(); // drain
          doRequest(next);
          return;
        }
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, body, headers: res.headers, finalUrl: target });
        });
      });
      req.on('timeout', () => { req.destroy(new Error('Request timed out after 30s')); });
      req.on('error', reject);
    };

    doRequest(url);
  });
}

/**
 * Extract all inline <script> blocks (those without a src attribute) from HTML.
 */
function extractInlineScripts(html) {
  const scripts = [];
  const regex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const code = m[1].trim();
    if (code) scripts.push(code);
  }
  return scripts;
}

/**
 * Check if a JavaScript code block is syntactically valid.
 * Uses vm.Script which parses with V8 (the same engine Chrome uses).
 */
function isJSValid(code) {
  try {
    new vm.Script(code, { filename: 'inline-check.js' });
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

/**
 * Check SSL certificate expiry for a hostname.
 */
function checkSSL(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect(443, hostname, { servername: hostname, rejectUnauthorized: true }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      if (!cert || !cert.valid_to) {
        resolve({ ok: false, error: 'No certificate found' });
        return;
      }
      const expiry = new Date(cert.valid_to);
      const daysLeft = Math.floor((expiry - new Date()) / (1000 * 60 * 60 * 24));
      resolve({ ok: daysLeft > 14, daysLeft, expiry: cert.valid_to });
    });
    socket.setTimeout(10000, () => { socket.destroy(); resolve({ ok: false, error: 'SSL check timed out' }); });
    socket.on('error', (e) => resolve({ ok: false, error: e.message }));
  });
}

// ─── Main monitoring logic ───────────────────────────────────────────────────

async function main() {
  const results = [];
  const failures = [];
  const hostname = new URL(SITE).hostname;

  console.log(`\n🛡️  CreatiHub Website Monitor`);
  console.log(`   Checking ${SITE}\n`);
  console.log(`${'─'.repeat(60)}\n`);

  // ── 1. SSL certificate check ──
  console.log('🔐 Checking SSL certificate...');
  const ssl = await checkSSL(hostname);
  if (ssl.ok) {
    console.log(`   ✅ SSL OK — expires in ${ssl.daysLeft} days (${ssl.expiry})`);
    results.push({ check: 'SSL certificate', status: 'PASS', detail: `${ssl.daysLeft} days left` });
  } else {
    const msg = ssl.error ? `SSL error: ${ssl.error}` : `SSL expires in ${ssl.daysLeft} days (${ssl.expiry}) — RENEW NOW!`;
    console.log(`   ❌ ${msg}`);
    failures.push({ check: 'SSL certificate', detail: msg });
    results.push({ check: 'SSL certificate', status: 'FAIL', detail: msg });
  }
  console.log('');

  // ── 2. Page checks (HTTP status + content proof + JS syntax) ──
  console.log('📄 Checking pages...\n');
  for (const page of PAGES) {
    const url = SITE + page.path;
    try {
      const res = await fetch(url);
      const okStatus = page.allowRedirect ? (res.status >= 200 && res.status < 400) : (res.status === 200);

      // Status check
      if (!okStatus) {
        const msg = `${page.desc} returned HTTP ${res.status}`;
        console.log(`   ❌ ${page.path} — ${msg}`);
        failures.push({ check: `Page: ${page.desc}`, detail: msg, url });
        results.push({ check: `Page: ${page.desc}`, status: 'FAIL', detail: msg });
        continue;
      }

      // Content proof check (skip if no proof keyword defined)
      let proofOk = true;
      if (page.proof) {
        const body = res.body || '';
        // Strip HTML tags for a rough text check
        const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        if (!text.toLowerCase().includes(page.proof.toLowerCase())) {
          proofOk = false;
          // Check if it's stuck on "Loading"
          const stuckLoading = /<div[^>]*>\s*Loading/i.test(body) || /class="empty"[^>]*>Loading/i.test(body);
          const msg = stuckLoading
            ? `${page.desc} is STUCK on "Loading…" (keyword "${page.proof}" not found)`
            : `${page.desc} loaded but keyword "${page.proof}" not found — content may be broken`;
          console.log(`   ❌ ${page.path} — ${msg}`);
          failures.push({ check: `Page content: ${page.desc}`, detail: msg, url });
          results.push({ check: `Page content: ${page.desc}`, status: 'FAIL', detail: msg });
          continue;
        }
      }

      // Inline JavaScript syntax check (the big one — catches the bug we just fixed)
      const scripts = extractInlineScripts(res.body || '');
      let jsErrors = [];
      for (let i = 0; i < scripts.length; i++) {
        const check = isJSValid(scripts[i]);
        if (!check.valid) {
          jsErrors.push(`script block #${i + 1}: ${check.error}`);
        }
      }
      if (jsErrors.length > 0) {
        const msg = `${page.desc} has ${jsErrors.length} JavaScript syntax error(s): ${jsErrors.join(' | ')}`;
        console.log(`   ❌ ${page.path} — ${msg}`);
        failures.push({ check: `JS syntax: ${page.desc}`, detail: msg, url });
        results.push({ check: `JS syntax: ${page.desc}`, status: 'FAIL', detail: msg });
        continue;
      }

      console.log(`   ✅ ${page.path} — OK (HTTP ${res.status}, ${scripts.length} inline scripts valid, proof found)`);
      results.push({ check: `Page: ${page.desc}`, status: 'PASS', detail: `HTTP ${res.status}` });
    } catch (e) {
      const msg = `${page.desc} — fetch error: ${e.message}`;
      console.log(`   ❌ ${page.path} — ${msg}`);
      failures.push({ check: `Page: ${page.desc}`, detail: msg, url });
      results.push({ check: `Page: ${page.desc}`, status: 'FAIL', detail: msg });
    }
  }
  console.log('');

  // ── 3. API endpoint checks ──
  console.log('🔌 Checking API endpoints...\n');
  for (const ep of API_ENDPOINTS) {
    const url = SITE + ep.path;
    try {
      const res = await fetch(url);
      if (res.status !== 200) {
        const msg = `${ep.desc} returned HTTP ${res.status}`;
        console.log(`   ❌ ${ep.path} — ${msg}`);
        failures.push({ check: `API: ${ep.desc}`, detail: msg, url });
        results.push({ check: `API: ${ep.desc}`, status: 'FAIL', detail: msg });
        continue;
      }
      // Try to parse JSON and validate structure
      let parsed;
      try {
        parsed = JSON.parse(res.body);
      } catch (e) {
        const msg = `${ep.desc} returned invalid JSON: ${e.message}`;
        console.log(`   ❌ ${ep.path} — ${msg}`);
        failures.push({ check: `API: ${ep.desc}`, detail: msg, url });
        results.push({ check: `API: ${ep.desc}`, status: 'FAIL', detail: msg });
        continue;
      }
      let typeOk;
      let summary;
      if (ep.expectKey) {
        // Expect an object containing a named array property (e.g. {services: [...]}).
        typeOk = typeof parsed === 'object' && parsed !== null &&
                 Array.isArray(parsed[ep.expectKey]);
        summary = typeOk ? `${parsed[ep.expectKey].length} items in "${ep.expectKey}"` : `missing or non-array "${ep.expectKey}" key`;
      } else {
        // Expect a plain object.
        typeOk = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
        summary = 'valid object';
      }
      if (!typeOk) {
        const msg = `${ep.desc} returned unexpected structure — ${summary}`;
        console.log(`   ⚠️  ${ep.path} — ${msg}`);
        failures.push({ check: `API: ${ep.desc}`, detail: msg, url });
        results.push({ check: `API: ${ep.desc}`, status: 'WARN', detail: msg });
        continue;
      }
      console.log(`   ✅ ${ep.path} — OK (${summary})`);
      results.push({ check: `API: ${ep.desc}`, status: 'PASS', detail: summary });
    } catch (e) {
      const msg = `${ep.desc} — fetch error: ${e.message}`;
      console.log(`   ❌ ${ep.path} — ${msg}`);
      failures.push({ check: `API: ${ep.desc}`, detail: msg, url });
      results.push({ check: `API: ${ep.desc}`, status: 'FAIL', detail: msg });
    }
  }

  // ── 4. Static asset checks ──
  console.log('📦 Checking critical static assets...\n');
  for (const asset of STATIC_ASSETS) {
    const url = SITE + asset.path;
    try {
      const res = await fetch(url);
      if (res.status !== 200) {
        const msg = `${asset.desc} returned HTTP ${res.status}`;
        console.log(`   ❌ ${asset.path} — ${msg}`);
        failures.push({ check: `Asset: ${asset.desc}`, detail: msg, url });
        results.push({ check: `Asset: ${asset.desc}`, status: 'FAIL', detail: msg });
        continue;
      }
      if (asset.proof && !res.body.includes(asset.proof)) {
        const msg = `${asset.desc} loaded but missing expected content "${asset.proof}"`;
        console.log(`   ⚠️  ${asset.path} — ${msg}`);
        failures.push({ check: `Asset: ${asset.desc}`, detail: msg, url });
        results.push({ check: `Asset: ${asset.desc}`, status: 'WARN', detail: msg });
        continue;
      }
      console.log(`   ✅ ${asset.path} — OK (${res.body.length} bytes)`);
      results.push({ check: `Asset: ${asset.desc}`, status: 'PASS', detail: `${res.body.length} bytes` });
    } catch (e) {
      const msg = `${asset.desc} — fetch error: ${e.message}`;
      console.log(`   ❌ ${asset.path} — ${msg}`);
      failures.push({ check: `Asset: ${asset.desc}`, detail: msg, url });
      results.push({ check: `Asset: ${asset.desc}`, status: 'FAIL', detail: msg });
    }
  }

  // ── 5. Summary ──
  console.log(`\n${'─'.repeat(60)}\n`);
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed, ${warned} warnings\n`);

  if (failures.length > 0) {
    console.log('❌ FAILURES DETECTED:\n');
    failures.forEach((f, i) => {
      console.log(`   ${i + 1}. [${f.check}]`);
      console.log(`      ${f.detail}`);
      if (f.url) console.log(`      URL: ${f.url}`);
      console.log('');
    });
    console.log('🚨 Action required — see details above.\n');

    // Write a failure report file for GitHub Actions to use as an annotation
    const report = failures.map(f => `❌ ${f.check}: ${f.detail}`).join('\n');
    require('fs').writeFileSync('/tmp/monitor-report.txt', report);

    // Exit with non-zero code so GitHub Actions marks the run as failed
    // → GitHub automatically emails the repo owner about failed runs
    process.exit(1);
  } else {
    console.log('✅ All checks passed — creatihub.com.ng is healthy!\n');
    require('fs').writeFileSync('/tmp/monitor-report.txt', '✅ All checks passed.');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('Monitor crashed:', e);
  process.exit(2);
});
