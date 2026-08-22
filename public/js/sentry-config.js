/* =====================================================================
   SENTRY ERROR + PERFORMANCE MONITORING — CONFIG FILE
   =====================================================================
   This single file controls Sentry for your ENTIRE website.
   You only need to edit this ONE file — not every page.

   ┌─────────────────────────────────────────────────────────────────┐
   │  HOW TO ACTIVATE SENTRY (5 minutes, free):                       │
   │                                                                  │
   │  1. Go to  https://sentry.io/signup/  and create a FREE account  │
   │     (free tier = 5,000 errors/month, no credit card needed)      │
   │                                                                  │
   │  2. Create a new project → choose "JavaScript" (Browser)         │
   │                                                                  │
   │  3. Sentry will show you a "DSN" that looks like this:           │
   │     https://abc123def456@o789012.ingest.sentry.io/1234567        │
   │                                                                  │
   │  4. Copy that entire DSN string.                                 │
   │                                                                  │
   │  5. Below, find the line that says:                              │
   │        dsn: 'PASTE_YOUR_DSN_HERE',                               │
   │     Replace PASTE_YOUR_DSN_HERE with your real DSN.              │
   │     Keep the quotes around it.                                   │
   │                                                                  │
   │  6. Save this file, then commit & push to GitHub. Done!          │
   │                                                                  │
   │  From now on, ANY JavaScript error on ANY page of your website   │
   │  will be automatically captured and you'll get an email alert.   │
   │  Performance tracing (page load times, API call times) is also   │
   │  captured automatically.                                         │
   └─────────────────────────────────────────────────────────────────┘

   This file follows the official Sentry instrumentation guide from
   https://skills.sentry.dev/instrument — using the Browser SDK with
   the recommended default setup (Error Monitoring + Tracing).
*/

window.SENTRY_CONFIG = {
  // ↓↓↓ PASTE YOUR SENTRY DSN BELOW (between the single quotes) ↓↓↓
  dsn: 'PASTE_YOUR_DSN_HERE',
  // ↑↑↑ REPLACE "PASTE_YOUR_DSN_HERE" WITH YOUR REAL DSN  ↑↑↑

  // --- Release & environment (best practice per Sentry docs) ---
  environment: 'production',
  release: 'creatihub@1.0.0',

  // --- Tracing (performance monitoring) ---
  // Capture 20% of transactions for performance data.
  // This keeps you well within the free tier while still getting useful data.
  tracesSampleRate: 0.2,

  // Outgoing requests that match these patterns receive distributed
  // tracing headers. We trace same-origin requests (your own API).
  tracePropagationTargets: ['localhost', /^https:\/\/creatihub\.com\.ng/],

  // --- Error capture settings ---
  attachStacktrace: true,     // include full stack traces on all events
  maxBreadcrumbs: 100,        // store up to 100 breadcrumbs (actions before error)

  // --- Privacy: don't send personal user data ---
  sendDefaultPII: false,

  // --- Filter out noise (browser extensions, etc.) ---
  denyUrls: [
    /chrome-extension:\/\//,
    /moz-extension:\/\//,
    /extensions\//,
    /^file:\/\//i,
  ],
};

/* =====================================================================
   AUTO-LOADER — DO NOT EDIT below this line.
   Loads the Sentry Browser SDK (errors + tracing bundle) from the
   official CDN and initialises it with the config above.

   If the DSN is still the placeholder, it silently skips (so your
   site works perfectly until you activate Sentry).

   This uses the CDN bundle approach (Path C) from the Sentry
   instrumentation guide — best for static HTML sites without a
   build system.
   ===================================================================== */
(function () {
  var cfg = window.SENTRY_CONFIG;
  if (!cfg || !cfg.dsn || cfg.dsn === 'PASTE_YOUR_DSN_HERE') {
    // Sentry not configured yet — silently skip (site works normally)
    if (window.console) console.log('[Sentry] Not configured — set your DSN in /js/sentry-config.js to activate error tracking.');
    return;
  }

  // Load the Sentry Browser SDK (errors + tracing bundle) from official CDN.
  // This is the "bundle.tracing.min.js" variant from the Sentry guide.
  // Version 10.42.0 is the version recommended by skills.sentry.dev/instrument.
  // The integrity attribute (SRI) ensures the file has not been tampered with.
  var s = document.createElement('script');
  s.src = 'https://browser.sentry-cdn.com/10.42.0/bundle.tracing.min.js';
  s.integrity = 'sha384-DIqcfVcfIewrWiNWfVZcGWExO5v673hkkC5ixJnmAprAfJajpUDEAL35QgkOB5gw';
  s.crossOrigin = 'anonymous';
  s.onload = function () {
    if (window.Sentry) {
      // Initialize with tracing integration (per Sentry recommended defaults)
      Sentry.init(Object.assign({}, cfg, {
        integrations: [
          // browserTracingIntegration() captures page load times, navigation,
          // and outgoing fetch/XHR requests automatically.
          Sentry.browserTracingIntegration ? Sentry.browserTracingIntegration() : null,
        ].filter(Boolean),
      }));
      if (window.console) console.log('[Sentry] Error + performance tracking is now ACTIVE for creatihub.com.ng');
    }
  };
  s.onerror = function () {
    if (window.console) console.warn('[Sentry] Could not load SDK from CDN — error tracking inactive.');
  };
  // Insert as the FIRST script so Sentry captures errors from all other scripts
  document.head.appendChild(s);
})();
