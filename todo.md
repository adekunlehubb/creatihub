# CreatiHub — Fix Video/Image Generation Format

## Investigation
- [x] Read current generator.js code
- [x] Research Gemini API docs — Interactions API for image gen
- [x] Verify model names (gemini-3.5-flash text, gemini-3.1-flash-image image — all valid)
- [x] Confirm root cause: image gen uses old generateContent endpoint instead of Interactions API

## Fix Plan
- [ ] Update geminiImageRaw() to use Interactions API (POST /v1beta/interactions)
- [ ] Parse Interactions API response format (output_image / steps)
- [ ] Keep generateContent for text models (still works)
- [ ] Test generator.js syntax
- [ ] Commit and push to GitHub + Railway

## Verify
- [ ] Ensure video generation produces real image assets (not text fallback)
- [ ] Confirm text deliverables still work
- [ ] Push to Railway deployment
