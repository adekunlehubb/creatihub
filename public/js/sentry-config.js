/* =====================================================================
   SENTRY ERROR TRACKING — CONFIG FILE
   =====================================================================
   This single file controls Sentry error tracking for your ENTIRE website.
   You only need to edit this ONE file — not every page.

   ┌─────────────────────────────────────────────────────────────────┐
   │  HOW TO ACTIVATE SENTRY (5 minutes, free):                       │
   │                                                                  │
   │  1. Go to  https://sentry.io/signup/  and create a FREE account  │
   │     (free tier = 5,000 errors/month, no credit card needed)      │
   │                                                                  │
   │  2. Click "Create Project" → choose "JavaScript" (Browser)       │
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
   └─────────────────────────────────────────────────────────────────┘
*/

window.SENTRY_CONFIG = {
  // ↓↓↓ PASTE YOUR SENTRY DSN BELOW (between the single quotes) ↓↓↓
  dsn: 'PASTE_YOUR_DSN_HERE',
  // ↑↑↑ REPLACE "PASTE_YOUR_DSN_HERE" WITH YOUR REAL DSN  ↑↑↑

  // --- Advanced settings (no need to change these) ---
  environment: 'production',
  release: 'creatihub@1.0',
  tracesSampleRate: 0,        // 0 = track errors only, not performance (stays in free tier)
  attachStacktrace: true,     // include full error stack traces in reports
  sendDefaultPII: false,      // don't collect personal user data
  denyUrls: [                 // ignore errors from browser extensions / ads
    /chrome-extension:/,
    /moz-extension:/,
    /extensions\//,
    /^file:\/\//i,
  ],
};

/* =====================================================================
   AUTO-LOADER — DO NOT EDIT below this line.
   Loads Sentry from the official CDN and initialises it with the
   config above. If the DSN is still the placeholder, it silently
   skips (so your site works perfectly until you activate Sentry).
   ===================================================================== */
(function () {
  var cfg = window.SENTRY_CONFIG;
  if (!cfg || !cfg.dsn || cfg.dsn === 'PASTE_YOUR_DSN_HERE') {
    if (window.console) console.log('[Sentry] Not configured yet — set your DSN in /js/sentry-config.js to activate error tracking.');
    return;
  }

  // Load Sentry browser SDK from official CDN
  var s = document.createElement('script');
  s.src = 'https://browser.sentry-cdn.com/8.42.0/bundle.min.js';
  s.crossOrigin = 'anonymous';
  s.onload = function () {
    if (window.Sentry) {
      window.Sentry.init(cfg);
      if (window.console) console.log('[Sentry] Error tracking is now ACTIVE for creatihub.com.ng');
    }
  };
  s.onerror = function () {
    if (window.console) console.warn('[Sentry] Could not load SDK from CDN — error tracking inactive.');
  };
  document.head.appendChild(s);
})();
