# Phase 10b — Co-Founder AI Real Creative Generation + Customer Experience

## Backend (DONE)
- [x] ai.js — Add `actions` array to Co-Founder responses (generate buttons)
- [x] server.js — Add MARKETING_GEN_MAP (13 types: cartoon, flyer, poster, video, logo, social, thumbnail, voiceover, jingle, copy, pitch)
- [x] server.js — Add POST /api/admin/cofounder/generate (creates synthetic order, runs generator.js, stores in db.marketingAssets)
- [x] server.js — Add GET /api/admin/cofounder/assets/:assetId/download/:fileId (base64 decode download)
- [x] server.js — Fix download endpoint file lookup (was matching runId instead of fileId)
- [x] server.js — Add GET /api/admin/cofounder/assets (list all generated assets)
- [x] server.js — Handle IS_LIVE=false with helpful notConfigured message
- [x] db.js — Add marketingAssets collection to ensureCollections() and makeFreshDb()

## Frontend (DONE)
- [x] admin.html — Update renderCoFounder() to handle actions array (render generate buttons)
- [x] admin.html — Add generateAsset() function (calls /admin/cofounder/generate, shows loading spinner)
- [x] admin.html — Display generated files with inline preview (images, video, audio) + download buttons
- [x] admin.html — Handle notConfigured response (show API key setup instructions)
- [x] admin.html — Handle error fallback (friendly message with suggestions)
- [x] admin.html — Add initial generate buttons to greeting (cartoon, flyer, video, logo)

## Testing (DONE)
- [x] Syntax check all files (server.js, ai.js, generator.js, db.js, admin.html)
- [x] Server starts cleanly on test port
- [x] Co-Founder chat returns actions array (3 actions on greeting)
- [x] Co-Founder generate endpoint returns notConfigured when no API key (cartoon, video, flyer)
- [x] Co-Founder generate endpoint returns error for invalid type
- [x] Customer Nova chat works (/api/chat)
- [x] Customer registration/login works
- [x] Customer order creation works (/api/orders → awaiting_payment)
- [x] Admin orders list works

## Deploy
- [ ] Commit and push all Phase 10b changes to GitHub
- [ ] Verify Railway auto-deploy succeeds
