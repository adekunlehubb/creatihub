# Railway Deployment Fix — CreatiHub

## Problem
Railway is showing an old deployment ("Add 5 new high-demand services") instead of the latest code (Phase 9: AI Training Engine + Email Broadcast + AI branding removed).

## Root Cause
**No GitHub webhook is configured on the repository.** Railway relies on GitHub webhooks to get notified when you push new code. Without a webhook, Railway never receives push notifications and cannot trigger automatic deployments.

GitHub repo confirmed at: https://github.com/adekunlehubb/creatihub
Latest commit: `8144526` — "Railway redeploy trigger — all Phase 9 features live"

## Solution — Step by Step

### Step 1: Reconnect GitHub in Railway (MOST IMPORTANT)
1. Go to your Railway project: https://railway.app
2. Click on your **CreatiHub** project
3. Go to **Settings** (gear icon) → **Source** tab
4. Look for the GitHub repo connection
5. If it shows disconnected or wrong repo:
   - Click **Disconnect**
   - Click **Connect Repo**
   - Select `adekunlehubb/creatihub`
   - Select branch: `main`

### Step 2: Enable Auto-Deploy
1. Still in **Settings** → **Source**
2. Find the toggle: **"Automatically deploy when code is pushed"**
3. Make sure it is **ON** (enabled)

### Step 3: Trigger a Manual Redeploy
1. Go to the **Deployments** tab
2. Click **Deploy Latest Commit** (or "Redeploy")
3. This forces Railway to pull the current `main` branch (`8144526`)

### Step 4: Check Deploy Logs
1. Click on the new deployment in the Deployments tab
2. Watch the build logs
3. You should see:
   - `npm install` running
   - `node server.js` starting
   - `✅ CreatiHub running on http://localhost:XXXX`

### Step 5: Verify the App
- Railway will give you a public URL (e.g., `creatihub-production.up.railway.app`)
- Visit it — you should see CreatiHub homepage
- Test: `/api/services` should return 19+ services
- Test: Login with admin@creatihub.com / Satellite@2020

## Recommended: Add PostgreSQL Database
For data persistence on Railway (so users/orders survive restarts):
1. In Railway project → **New** → **Database** → **PostgreSQL**
2. Railway auto-creates a `DATABASE_URL` variable
3. Your app auto-detects it and switches from JSON file to PostgreSQL
4. No code changes needed — db-pg.js handles it automatically

## Recommended: Set Environment Variables
In Railway **Variables** tab, add:
- `ADMIN_PASSWORD` = your secure admin password
- `GEMINI_API_KEY` = your Gemini API key (for live AI training)
- `OPENAI_API_KEY` = your OpenAI API key (alternative AI provider)
- `PAYSTACK_SECRET_KEY` = your Paystack secret key (for real payments)
- `RESEND_API_KEY` = your Resend key (for real email sending)

## What's in the Latest Code (commit 8144526)
✅ 19+ creative services (flyer design, logo, video, voiceover, AI chatbot, product photography, music jingles, pitch deck, pro headshots, YouTube thumbnails, etc.)
✅ AI Training Engine — generates lessons + interactive tutor (no AI branding shown to students)
✅ Admin Email Broadcast — template generator, bulk email, individual email
✅ Admin Dashboard — see all enrollments, programs, users, email history
✅ Paystack payment integration (demo mode without API key)
✅ PostgreSQL support (auto-activates with DATABASE_URL)
✅ Multi-currency support (USD, NGN, GBP, EUR, CAD, etc.)
