# AI Provider Research — Nigerian Payment Methods

## The Core Problem
OpenAI does not accept Nigerian Naira cards or Nigerian bank transfers for API credit purchases. Nigerian-issued Visa/Mastercard cards are frequently declined by OpenAI's Stripe-based payment processor. This blocks Nigerian developers from topping up OpenAI API credits directly.

## Key Findings

### 1. OpenAI Itself CAN Be Paid From Nigeria — With a Virtual Dollar Card
From the OpenAI Developer Community thread (https://community.openai.com/t/i-am-unable-to-make-payments-for-open-ai-api-in-nigeria/605928):
- Nigerian Naira cards: consistently declined
- Chipper Cash virtual card: did NOT work for API (worked for ChatGPT Plus)
- Eversend virtual card: worked for ChatGPT Plus but NOT for API
- **Geegpay (Raenest) virtual dollar card: WORKED for OpenAI API** (confirmed June 2025, still working Jan 2026)

**Conclusion**: The user's OpenAI key is valid. They just need to fund it. A Geegpay/Raenest virtual dollar card (funded with Naira) can be used to add credits to their existing OpenAI account. No code changes needed.

### 2. Alternative AI Providers — Availability & Payment

#### A. Anthropic Claude API
- Nigeria IS on the supported countries list (both API and Claude.ai)
- Payment via credit/debit card (Stripe) — same virtual dollar card workaround applies
- Excellent for text generation, copywriting, translation, SEO content
- Does NOT do image generation or TTS audio
- Pricing: Claude 3.5 Sonnet ~$3/M input, $15/M output tokens

#### B. Google Gemini API (AI Studio)
- **FREE TIER available with NO credit card required** — get API key instantly
- Free tier limits: ~15 RPM, 1500 RPD, 1M TPM (varies by model)
- Does text generation, image generation (Imagen), and has multi-modal capabilities
- Paid tier uses Google Cloud billing (also works with virtual dollar cards)
- **Best option for starting FREE with no payment needed at all**
- Pricing (paid): Gemini 1.5 Flash ~$0.075/M input, Gemini 1.5 Pro ~$1.25/M input
- Image generation via Imagen 3 available through Gemini API

#### C. Groq API
- **FREE TIER with NO credit card required** — instant API key
- Ultra-fast inference (LPU chips) for open-source models (Llama, Mixtral, etc.)
- Text generation only (no image/audio)
- Great for fast text: copywriting, SEO, translation, chatbot responses
- Free tier: ~30 RPM, 14,400 RPD
- Paid tier: card-based billing

#### D. Fal.ai
- Credit-based system (prepaid USD balance)
- Excellent for image generation, video generation, audio
- Card-based payment (virtual dollar card works)
- API key required, credits purchased upfront
- Supports Stable Diffusion, Flux, and many image/video models
- Good alternative to DALL-E for image generation

#### E. Segmind
- Credit-based prepaid system
- Image generation models (SDXL, etc.)
- Card-based payment
- Marketed specifically to developers in emerging markets (India focus, similar payment constraints)

#### F. Stability AI
- Credit-based API for Stable Diffusion models
- Card-based payment
- Image generation focus

#### G. Together AI
- Open-source model hosting (Llama, etc.)
- Text + image generation
- Card-based payment (Visa/Mastercard/Amex) — virtual dollar card works
- Pay-as-you-go pricing

#### H. Replicate
- Credit-based prepaid system
- Huge model library (images, video, audio, text)
- Card-based payment
- Virtual dollar card works

### 3. Nigerian Virtual Dollar Card Providers (The Universal Workaround)
These let you fund a USD-denominated virtual card with Naira, which can then be used on ANY international platform:

| Provider | Funding | Card Network | Notes |
|----------|---------|-------------|-------|
| **Geegpay (Raenest)** | Naira → USD | Visa/Mastercard | Confirmed working for OpenAI API. Freelancer-focused. |
| **Cardify** | Naira or USDT | Visa/Mastercard | Gift card trading + virtual cards |
| **Chipper Cash** | Naira | Visa | Cross-border payments app. Works for some services. |
| **ALAT by Wema** | Naira | Visa/Mastercard | Digital bank, reliable, CBN-regulated |
| **Eversend** | Bank/debit/mobile money | Visa | $1/month maintenance fee |
| **Grey** | Naira | Visa/Mastercard | Popular for freelancers |
| **Micro E-pay** | Naira | Visa | Specializes in AI subscriptions |

## Recommendations for CreatiHub

### Option 1: Keep OpenAI — Fund via Geegpay Virtual Dollar Card (EASIEST)
- **Zero code changes needed**
- User's existing OpenAI key already works (just needs credits)
- Sign up at Geegpay (Raenest) → fund with Naira → get virtual dollar card
- Add the card to OpenAI billing → purchase credits
- Cost: ~$5-10 to start (covers dozens of generations)

### Option 2: Switch to Google Gemini (BEST FREE START)
- **Free tier requires NO credit card**
- Get API key at https://aistudio.google.com
- Supports text generation AND image generation (Imagen)
- Would require modifying generator.js to use Gemini API instead of OpenAI
- Free tier is generous enough for initial testing and low volume

### Option 3: Multi-Provider Setup (MOST ROBUST)
- Use Groq (free, no card) for text generation
- Use Google Gemini (free tier) for image generation
- Use Fal.ai or Replicate (virtual dollar card) for specialized image/video
- Requires significant generator.js rewrite to support multiple providers
- Most resilient but most complex

### Option 4: Anthropic Claude for Text + Keep OpenAI for Images
- Claude API for all text services (copywriting, SEO, translation, chatbot logic)
- OpenAI DALL-E for images (funded via virtual card)
- OpenAI TTS for audio (funded via virtual card)
- Requires moderate generator.js changes

## My Recommendation: Option 1 (Geegpay + OpenAI) or Option 2 (Gemini)

**Option 1** is the fastest path to a working product — no code changes, just fund the existing OpenAI account.

**Option 2** (Google Gemini) is the best if the user wants to avoid any international payment entirely — the free tier needs no card at all, and I can modify generator.js to use Gemini's API for both text and image generation.
