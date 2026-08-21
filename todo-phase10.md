# CreatiHub — Fix Nova AI Chat + Add Co-Founder AI Assistant

## Phase 10: AI Chat Reliability + Marketing Co-Founder AI

### Bug Fix: Nova AI Chat Error
- [x] Add try-catch to `/api/chat` endpoint (user-facing Nova chat)
- [x] Add try-catch to `/api/admin/chat` endpoint (admin chat)
- [x] Return friendly error message instead of "request failed"
- [x] Test both endpoints locally

### Feature: Admin Co-Founder AI (Marketing & Advertising Generator)
- [x] Build coFounderAssistant + safeCoFounderAssistant in ai.js
  - [x] Generate advertising campaign ideas (cartoon videos, animated ads, social media)
  - [x] Generate marketing strategies to pull more crowds
  - [x] Suggest ad copy, slogans, hooks
  - [x] Recommend platforms (TikTok, Instagram, YouTube, Facebook)
  - [x] Generate content calendar ideas
  - [x] Budget allocation recommendations
- [x] Add new endpoint `/api/admin/cofounder` for the co-founder AI chat
- [ ] Build co-founder AI UI section in admin dashboard (nav item + renderCoFounder)
- [x] Test the co-founder AI backend with various marketing queries

### Deploy
- [ ] Commit and push all Phase 10 changes to GitHub
- [ ] Verify Railway deploys successfully (app stays ACTIVE)
- [ ] Verify Nova AI chat works on Railway
- [ ] Verify Co-Founder AI accessible in admin dashboard
