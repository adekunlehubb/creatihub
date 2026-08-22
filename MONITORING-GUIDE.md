# 🛡️ CreatiHub Website Monitoring — Complete Setup Guide

This guide walks you through **three layers of protection** for your website
(creatihub.com.ng). Together, they make sure you're alerted the moment anything
goes wrong — whether it's a crash, a broken page, a JavaScript error, or an
expired SSL certificate.

| Layer | What it catches | Cost | Setup time |
|-------|----------------|------|-----------|
| **A. UptimeRobot** | Site goes down or a page shows wrong content | Free | ~10 min |
| **B. Sentry** | JavaScript errors that break pages for users | Free (5K errors/mo) | ~5 min |
| **C. GitHub Actions Monitor** | Deep checks every 6 hours (JS syntax, APIs, SSL, pages) | Free | Already built ✅ |

---

## Layer A — UptimeRobot (External Uptime Monitor)

UptimeRobot is a free service that pings your website every 5 minutes from
servers around the world. If your site doesn't respond, or responds with the
wrong content, it emails you immediately. This is your **first line of defense**
— it catches total outages fast.

### Step 1 — Create a free account

1. Open your browser and go to: **https://uptimerobot.com**
2. Click the green **"Register for FREE"** button (top right).
3. Enter your email address, a password, and your name.
4. Click **"Register"**.
5. Check your email inbox — UptimeRobot will send a confirmation link. Click it
   to activate your account.

### Step 2 — Add your first monitor (the homepage)

1. Log in to UptimeRobot. You'll see a dashboard that says "0 monitors."
2. Click the purple **"+ Add New Monitor"** button.
3. Fill in the form exactly like this:

   | Field | What to type |
   |-------|-------------|
   | **Monitor Type** | Select **"HTTP(s)"** |
   | **Friendly Name** | `CreatiHub Homepage` |
   | **URL (or IP)** | `https://creatihub.com.ng` |
   | **Monitoring Interval** | `5 minutes` |
   | **Monitor Timeout** | `30 seconds` (leave default) |

4. Scroll down to the **"Keyword Monitoring"** section and turn it **ON**.
   - **Keyword:** type `CreatiHub`
   - **Keyword Case Type:** select **"Case Insensitive"**
   - This means UptimeRobot won't just check that the page loads — it will
     verify the page actually contains the word "CreatiHub." If your homepage
     ever gets stuck on "Loading…" (like the bug we just fixed), this will
     catch it because the word won't appear.
5. Leave "Alert Contacts To Notify" as default (it uses your email).
6. Click the green **"Create Monitor"** button at the bottom.

### Step 3 — Add monitors for your key pages

Repeat Step 2 for each of these pages. Each one catches a different kind of
problem:

| Friendly Name | URL | Keyword |
|--------------|-----|---------|
| CreatiHub Services | `https://creatihub.com.ng/services` | `Services` |
| CreatiHub Order Page | `https://creatihub.com.ng/order?service=logo-design` | `Choose your package` |
| CreatiHub Auth Page | `https://creatihub.com.ng/auth` | `Join CreatiHub` |
| CreatiHub Training | `https://creatihub.com.ng/training` | `Training` |
| CreatiHub Learn | `https://creatihub.com.ng/learn` | `Learn` |
| CreatiHub Dashboard | `https://creatihub.com.ng/dashboard` | *(leave keyword off — this page may redirect to login)* |

For the Dashboard monitor, set Monitor Type to **"HTTP(s)"** but **leave keyword
monitoring OFF** — the dashboard may redirect unauthenticated visitors to the
login page, which is normal. We just want to know the route responds.

### Step 4 — Add a Port/SSL monitor (bonus — catches SSL expiry)

1. Click **"+ Add New Monitor"** again.
2. Set **Monitor Type** to **"HTTP(s) – Keyword"** (or just "HTTP(s)" if you
   prefer — UptimeRobot automatically checks SSL certificate validity on all
   HTTPS monitors and will warn you if the cert is close to expiring).
3. Actually, the simplest approach: UptimeRobot **automatically monitors SSL
   certificates** on every HTTPS monitor you create. You'll get a warning email
   when any certificate is within 14 days of expiry. No extra setup needed!

### Step 5 — Test that alerts work

1. On your UptimeRobot dashboard, find the "CreatiHub Homepage" monitor.
2. Click the three dots (⋯) next to it → **"Test Alert"**.
3. You should receive a test email within a minute. Check your spam folder if
   you don't see it, and mark it as "Not Spam."

### Step 6 — (Optional) Get phone push notifications

1. On the left sidebar, click **"My Settings"**.
2. Scroll down to **"Alert Contacts."**
3. You can add additional alert contacts (Slack, Discord, Telegram, SMS, voice
   call) — some are free, some are paid. Email alerts are always free.

### You're done with Layer A! ✅

UptimeRobot will now ping your site every 5 minutes, 24/7, for free. If
anything goes down, you get an email within 5 minutes.

---

## Layer B — Sentry (JavaScript Error Tracking)

Sentry catches JavaScript errors that happen in your visitors' browsers — the
kind of errors that make pages freeze on "Loading…" or silently break buttons.
Even if the page loads fine for UptimeRobot, a JS error could be breaking it for
real users. Sentry catches those.

**Good news:** I've already added the Sentry code to all 13 pages of your
website. You just need to create a free Sentry account and paste in one code.

### Step 1 — Create a free Sentry account

1. Open your browser and go to: **https://sentry.io/signup/**
2. Sign up with your Google account, GitHub account, or email.
3. (No credit card needed — the free "Developer" plan includes 5,000 errors per
   month, which is plenty for your site.)

### Step 2 — Create a project

1. After logging in, you'll see a "Projects" page. Click **"Create Project"**.
2. Under "Select a platform," choose **"JavaScript"** (the browser icon).
3. Under "Alert settings," leave the default ("Send me an email when a new issue
   is first seen").
4. Give the project a name: `creatihub-website`
5. Click **"Create Project"** at the bottom.

### Step 3 — Copy your DSN

1. After creating the project, Sentry shows a setup page with a code snippet.
2. Look for the line that says `Sentry.init({` — right above or inside it, there
   will be a **DSN** that looks like this:
   ```
   https://abc123def456@o789012.ingest.sentry.io/1234567
   ```
3. Copy that entire DSN string (the whole `https://...` URL).

### Step 4 — Paste your DSN into your website

1. Go to your GitHub repository: **https://github.com/Adekunlehubb/creatihub**
   (or whatever your repo URL is).
2. Navigate to: **public/js/sentry-config.js**
3. Click the **pencil icon** (✏️) in the top right to edit the file.
4. Find this line (near the top):
   ```javascript
   dsn: 'PASTE_YOUR_DSN_HERE',
   ```
5. Replace `PASTE_YOUR_DSN_HERE` with your actual DSN. It should look like:
   ```javascript
   dsn: 'https://abc123def456@o789012.ingest.sentry.io/1234567',
   ```
   (Keep the single quotes around it.)
6. Scroll down and click the green **"Commit changes"** button.
7. Add a commit message like: `Activate Sentry error tracking` and click
   **"Commit changes"** again.

That's it! Since your site auto-deploys from GitHub, Sentry will be live within
a couple of minutes.

### Step 5 — Verify Sentry is working

1. Wait 2-3 minutes for the deploy to go through.
2. Open your website: **https://creatihub.com.ng**
3. Press **F12** (or right-click → "Inspect") to open your browser's Developer
   Tools.
4. Go to the **Console** tab.
5. You should see a message: `[Sentry] Error tracking is now ACTIVE for
   creatihub.com.ng`
6. (Optional) To test error capture, type this in the console and press Enter:
   ```javascript
   throw new Error('Sentry test — please ignore');
   ```
7. Go back to your Sentry dashboard (https://sentry.io) → click your project.
   You should see the test error appear within a few seconds.

### What Sentry will catch for you

- ❌ Any uncaught JavaScript error on any page
- ❌ The exact "Loading…" freeze bug type (broken inline scripts)
- ❌ Failed API calls that cause page errors
- ❌ Errors in specific browsers (Chrome, Safari, Firefox, mobile)
- ❌ The exact line of code and file that caused each error
- 📧 An email alert every time a NEW error type appears

### You're done with Layer B! ✅

---

## Layer C — GitHub Actions Monitor (Deep Health Checks)

This is already **fully built and ready** — I created a monitoring script that
runs automatically every 6 hours via GitHub Actions. Here's what it does:

### What the monitor checks (every 6 hours)

1. **SSL certificate** — warns if it's expiring within 14 days
2. **11 web pages** — checks each loads with HTTP 200, contains expected
   content (catches "Loading…" freeze), and validates all inline JavaScript
   syntax (catches the exact bug type we fixed)
3. **6 API endpoints** — verifies `/api/services`, `/api/tracks`,
   `/api/training`, `/api/config`, `/health`, and `/__ninja/health` all respond
   with correct JSON structure
4. **3 critical static assets** — checks `/js/sentry-config.js`, `/js/app.js`,
   and `/css/style.css` all load correctly

### How you get alerted

GitHub automatically emails the repository owner (you) whenever a scheduled
workflow **fails**. So if any of the 20+ checks fail, you get an email within 6
hours. You can also view all past runs at:
`https://github.com/Adekunlehubb/creatihub/actions`

### What's left to activate it

The monitor files (`monitor.js` and `.github/workflows/website-monitor.yml`)
need to be **committed and pushed to GitHub**. Once pushed, the workflow will
run automatically on the schedule. You can also trigger it manually:

1. Go to your repo on GitHub → click the **"Actions"** tab.
2. On the left sidebar, click **"Website Monitor"**.
3. Click the **"Run workflow"** button (top right) → **"Run workflow"**.
4. Wait ~2 minutes, then click on the run to see the full report.

### You're done with Layer C! ✅ (once pushed)

---

## 📋 Quick Summary — What to do

| # | Task | Where | Time |
|---|------|-------|------|
| 1 | Create UptimeRobot account + add 6 monitors | https://uptimerobot.com | ~10 min |
| 2 | Create Sentry account + copy DSN | https://sentry.io/signup | ~3 min |
| 3 | Paste DSN into sentry-config.js on GitHub | Your GitHub repo | ~2 min |
| 4 | Push monitor files to GitHub (I'll help with this) | Terminal / GitHub | ~1 min |

After these four steps, your website will have **24/7 automated monitoring** on
three levels. You'll know about problems before your users do.

---

## 🔔 Important Security Reminder

**Revoke any GitHub tokens you pasted in chat earlier.** Even though this is a
private conversation, pasted tokens should always be revoked after use. To
revoke:

1. Go to: https://github.com/settings/tokens
2. Find any tokens that look like `ghp_...` that you created for this session.
3. Click **"Delete"** next to each one.
4. They're now permanently invalid — no one can use them.
