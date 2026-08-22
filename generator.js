// ============================================================
// CreatiHub AI Generation Engine — Dual Provider (Gemini + OpenAI)
// ============================================================
// Unified module that turns a paid order into real deliverables.
//
// PROVIDER AUTO-DETECTION:
//   The engine reads two environment variables:
//     • GEMINI_API_KEY  — Google Gemini (FREE tier, no credit card)
//     • OPENAI_API_KEY  — OpenAI (paid, requires credits)
//
//   At runtime the dispatcher chooses the best available provider
//   for each service kind:
//
//     image       → OpenAI DALL-E 3 if available, else Gemini image
//                   (Nano Banana generateContent). Free-tier Gemini has
//                   0 image quota → falls back to a detailed concept brief.
//     text        → OpenAI GPT-4o if available, else Gemini Flash
//     translation → OpenAI GPT-4o if available, else Gemini Flash
//     audio       → OpenAI TTS if available, else Gemini TTS
//                   (gemini-3.1-flash-tts-preview — discovered Phase 7b)
//     video       → OpenAI (narration + poster) if available,
//                   else Gemini (poster + text script)
//     html        → Template-based (no AI call needed)
//
//   If neither key is set the engine refuses to generate and throws
//   a clear configuration error.
//
//   If only Gemini is set, ALL 19 services work on the free tier —
//   including audio (Gemini now has TTS). The only limitation is
//   image generation: the free tier has 0 quota for image models, so
//   image orders produce a detailed visual concept brief instead of
//   a raster image. Adding OpenAI credits auto-upgrades images to
//   real DALL-E 3 output.
//
// Every generator returns a Promise resolving to an array of
// deliverable objects:
//   {
//     id, kind: 'image'|'audio'|'text'|'video'|'html',
//     filename, mime, content (base64 for binary, text for text),
//     encoding: 'base64'|'utf8', isDemo: false,
//     summary, generatedAt, provider
//   }
//
// The server stores these on the order as `order.deliverables` and
// exposes them via GET /api/orders/:id/deliverables.
// ============================================================

const crypto = require('crypto');
const https = require('https');

// --- Environment / provider detection --------------------------------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BASE = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

const HAS_OPENAI = OPENAI_API_KEY.length > 20;
const HAS_GEMINI = GEMINI_API_KEY.length > 10;
const IS_LIVE = HAS_OPENAI || HAS_GEMINI;

const MODEL_TEXT = process.env.OPENAI_TEXT_MODEL || 'gpt-4o';
const MODEL_IMAGE = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
const TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'alloy';
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash';
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview';

// Provider descriptor for /api/config reporting
const PROVIDER = {
  gemini: HAS_GEMINI,
  openai: HAS_OPENAI,
  primary: HAS_OPENAI ? 'openai' : (HAS_GEMINI ? 'gemini' : 'none'),
  text: HAS_OPENAI ? 'openai' : (HAS_GEMINI ? 'gemini' : 'none'),
  image: HAS_OPENAI ? 'openai' : (HAS_GEMINI ? 'gemini' : 'none'),
  audio: HAS_OPENAI ? 'openai' : (HAS_GEMINI ? 'gemini' : 'none'), // Gemini TTS (Phase 7b)
  video: HAS_OPENAI ? 'openai' : (HAS_GEMINI ? 'gemini' : 'none'),
  html: 'template'
};

// --- Service → generation kind mapping ------------------------------
const SERVICE_KIND = {
  'flyer-design': 'image',
  'logo-design': 'image',
  'social-media-kit': 'image',
  'youtube-thumbnails': 'image',
  'merch-tshirt': 'image',
  'book-cover': 'image',
  'product-photography': 'image',
  'pro-headshots': 'image',
  'cartoon-maker': 'image',
  'virtual-staging': 'image',
  'voiceover': 'audio',
  'music-jingles': 'audio',
  'automated-video': 'video',
  'seo-copywriting': 'text',
  'email-campaign': 'text',
  'pitch-deck': 'text',
  'translation': 'translation',
  'website-design': 'html',
  'ai-chatbot': 'html'
};

function modeLabel() {
  if (HAS_OPENAI && HAS_GEMINI) return 'live (Gemini + OpenAI)';
  if (HAS_OPENAI) return 'live (OpenAI)';
  if (HAS_GEMINI) return 'live (Gemini)';
  return 'not configured (set GEMINI_API_KEY and/or OPENAI_API_KEY)';
}

function shortId(prefix) {
  return (prefix || 'del') + '_' + crypto.randomBytes(5).toString('hex');
}

function escapeXml(s) {
  return String(s || '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

// ====================================================================
// LOW-LEVEL HTTP HELPERS
// ====================================================================

// --- OpenAI JSON POST (returns parsed JSON) -------------------------
function openaiPost(pathname, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(OPENAI_BASE + pathname);
    const payload = JSON.stringify(body);
    const req = https.request({
      method: 'POST',
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 120000
    }, (resp) => {
      let data = '';
      resp.on('data', (c) => { data += c; });
      resp.on('end', () => {
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Bad JSON from OpenAI: ' + data.slice(0, 200))); }
        } else {
          reject(new Error('OpenAI HTTP ' + resp.statusCode + ': ' + data.slice(0, 300)));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('OpenAI request timed out')); });
    req.write(payload);
    req.end();
  });
}

// --- OpenAI raw binary POST (returns Buffer, for TTS) ---------------
function openaiRawPost(pathname, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(OPENAI_BASE + pathname);
    const payload = JSON.stringify(body);
    const req = https.request({
      method: 'POST',
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 120000
    }, (resp) => {
      if (resp.statusCode !== 200) {
        let d = ''; resp.on('data', c => d += c); resp.on('end', () => reject(new Error('TTS HTTP ' + resp.statusCode + ': ' + d.slice(0, 200))));
        return;
      }
      const chunks = [];
      resp.on('data', c => chunks.push(c));
      resp.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('TTS request timed out')));
    req.write(payload);
    req.end();
  });
}

// Download a URL → Buffer (used for DALL-E image URLs).
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'Authorization': 'Bearer ' + OPENAI_API_KEY }
    }, (resp) => {
      if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
        return downloadBuffer(resp.headers.location).then(resolve, reject);
      }
      if (resp.statusCode !== 200) {
        let d = ''; resp.on('data', (c) => d += c); resp.on('end', () => reject(new Error('Download HTTP ' + resp.statusCode)));
        return;
      }
      const chunks = [];
      resp.on('data', (c) => chunks.push(c));
      resp.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// --- Gemini JSON POST (returns parsed JSON) -------------------------
// Gemini uses the x-goog-api-key header instead of Bearer auth.
// Includes automatic retry with backoff for 503 (model overloaded)
// and 429 (rate limit) errors — these are transient Gemini-side issues.
function geminiPostOnce(pathname, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(GEMINI_BASE + pathname);
    const payload = JSON.stringify(body);
    const req = https.request({
      method: 'POST',
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 120000
    }, (resp) => {
      let data = '';
      resp.on('data', (c) => { data += c; });
      resp.on('end', () => {
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Bad JSON from Gemini: ' + data.slice(0, 200))); }
        } else if (resp.statusCode === 503 || resp.statusCode === 429) {
          // Transient — signal retry to the wrapper
          reject(new Error('GEMINI_RETRY:' + resp.statusCode + ':' + data.slice(0, 300)));
        } else {
          reject(new Error('Gemini HTTP ' + resp.statusCode + ': ' + data.slice(0, 300)));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('Gemini request timed out')); });
    req.write(payload);
    req.end();
  });
}

// Retry wrapper: up to 3 retries with exponential backoff for 503/429.
async function geminiPost(pathname, body) {
  const maxRetries = 3;
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await geminiPostOnce(pathname, body);
    } catch (e) {
      lastErr = e;
      const msg = String(e.message || e);
      if (msg.startsWith('GEMINI_RETRY:') && attempt < maxRetries) {
        const backoff = Math.min(2000 * Math.pow(2, attempt), 16000); // 2s, 4s, 8s, 16s cap
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      // Non-retryable error or out of retries
      if (msg.startsWith('GEMINI_RETRY:')) {
        const parts = msg.split(':');
        throw new Error('Gemini HTTP ' + parts[1] + ' (retried ' + maxRetries + 'x, still overloaded): ' + (parts[2] || '').slice(0, 200));
      }
      throw e;
    }
  }
  throw lastErr;
}

// ====================================================================
// PROMPT BUILDERS
// ====================================================================

function buildImagePrompt(order) {
  const svc = order.serviceName || order.serviceId;
  const pkg = order.packageName || 'Standard';
  return [
    `Professional ${svc} (${pkg} package).`,
    `Client brief: ${order.requirements || 'No specific brief — use your creative judgement.'}`,
    'Clean, high-resolution, print-ready, commercially usable, no copyrighted logos or text watermarks.'
  ].join(' ');
}

function buildCopyPrompt(order, kind) {
  const svc = order.serviceName || order.serviceId;
  const pkg = order.packageName || 'Standard';
  const role = {
    'seo-copywriting': 'expert SEO copywriter',
    'email-campaign': 'email marketing strategist',
    'pitch-deck': 'startup pitch-deck writer'
  }[order.serviceId] || 'professional copywriter';
  return [
    `You are an ${role}.`,
    `Task: ${svc} — ${pkg} package.`,
    `Client brief / requirements: ${order.requirements || 'General purpose — produce a strong generic deliverable.'}`,
    'Return well-structured, ready-to-use content in clear sections using Markdown headings (##). Do not include preamble.'
  ].join('\n');
}

function buildTranslationPrompt(order, text) {
  const req = (order.requirements || '').trim();
  return [
    'You are a professional human-quality translator.',
    'Translate the following text faithfully, preserving tone, formatting and meaning.',
    req ? ('Additional instructions from client: ' + req) : '',
    'Return ONLY the translated text, no commentary.',
    '--- TEXT START ---',
    text || '(No text provided — translate a friendly placeholder message.)',
    '--- TEXT END ---'
  ].filter(Boolean).join('\n');
}

function buildNarrationScript(order) {
  const svc = order.serviceName || order.serviceId;
  const pkg = order.packageName || 'Standard';
  return [
    `A short professional narration script for a ${pkg} ${svc}.`,
    `Brief: ${order.requirements || 'A 20-second promotional spot.'}`,
    'Write ~120 words of engaging voiceover copy suitable for narration.'
  ].join(' ');
}

// Template-based narration script — used when Gemini text quota is exhausted.
// Produces a professional 100-130 word voiceover without any API call.
function buildTemplateNarration(order) {
  const svc = order.serviceName || order.serviceId || 'creative service';
  const brief = (order.requirements || '').slice(0, 200);
  const brand = (brief.match(/(?:called|named|for)\s+([A-Z][a-zA-Z0-9\s]+)/) || [])[1] || 'your brand';
  return [
    `Looking for professional ${svc}?`,
    `${brand} delivers exceptional quality that sets you apart from the competition.`,
    brief ? `Our focus: ${brief}.` : `We bring your vision to life with creativity and precision.`,
    `From concept to completion, every detail is crafted with care.`,
    `Ready to elevate your project? Choose ${brand} for results that speak for themselves.`,
    `Visit CreatiHub today to get started.`
  ].join(' ');
}

// ====================================================================
// GEMINI GENERATORS
// ====================================================================

// --- Gemini text generation (generateContent) -----------------------
// POST /models/{model}:generateContent
// Body: { contents:[{parts:[{text:"..."}]}], generationConfig:{temperature:0.7} }
// Response: candidates[0].content.parts[0].text
async function geminiTextRaw(prompt) {
  const body = await geminiPost(`/models/${GEMINI_TEXT_MODEL}:generateContent`, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
  });
  const text = body.candidates && body.candidates[0] && body.candidates[0].content &&
               body.candidates[0].content.parts && body.candidates[0].content.parts[0] &&
               body.candidates[0].content.parts[0].text;
  if (!text) throw new Error('Gemini returned no text (response: ' + JSON.stringify(body).slice(0, 200) + ')');
  return text;
}

// --- Gemini image generation (Interactions API) --------------------
// Google's current image models (gemini-3.1-flash-image "Nano Banana 2")
// use the Interactions API: POST /v1beta/interactions
//   Body: { model: "gemini-3.1-flash-image", input: [{type:"text",text:"..."}] }
//   Response: { output_image: { data: "<base64>", mime_type }, steps:[...] }
// We extract the image from output_image (convenience) and also scan
// steps[].content[] for image blocks (handles interleaved output).
// If the Interactions API fails we fall back to generateContent with
// responseModalities (legacy path, works for gemini-2.5-flash-image).
async function geminiImageRaw(prompt) {
  // --- Primary: Interactions API ---
  try {
    const body = await geminiPost('/interactions', {
      model: GEMINI_IMAGE_MODEL,
      input: [{ type: 'text', text: prompt }]
    });
    const images = [];
    // Convenience property: output_image.data (base64)
    if (body.output_image && body.output_image.data) {
      images.push({
        bytesBase64Encoded: body.output_image.data,
        mimeType: body.output_image.mime_type || 'image/png'
      });
    }
    // Also scan steps for image content blocks (interleaved output)
    if (Array.isArray(body.steps)) {
      for (const step of body.steps) {
        if (step.type === 'model_output' && Array.isArray(step.content)) {
          for (const block of step.content) {
            if (block.type === 'image' && block.data) {
              images.push({
                bytesBase64Encoded: block.data,
                mimeType: block.mime_type || 'image/png'
              });
            }
          }
        }
      }
    }
    if (images.length) {
      const texts = [];
      if (body.output_text) texts.push(body.output_text);
      return { images, texts, raw: body };
    }
    // No image found — fall through to legacy attempt
    throw new Error('Interactions API returned no image (response: ' + JSON.stringify(body).slice(0, 200) + ')');
  } catch (interactionsErr) {
    // --- Fallback: legacy generateContent with responseModalities ---
    // Works for gemini-2.5-flash-image and some older models.
    const body = await geminiPost(`/models/${GEMINI_IMAGE_MODEL}:generateContent`, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 8192,
        responseModalities: ['TEXT', 'IMAGE']
      }
    });
    const parts = body.candidates && body.candidates[0] && body.candidates[0].content &&
                 body.candidates[0].content.parts;
    if (!parts || !parts.length) {
      throw new Error('Gemini image returned no parts (response: ' + JSON.stringify(body).slice(0, 200) + ')');
    }
    const images = parts.filter(p => p.inlineData && p.inlineData.data).map(p => ({
      bytesBase64Encoded: p.inlineData.data,
      mimeType: p.inlineData.mimeType || 'image/png'
    }));
    if (!images.length) {
      throw new Error('Gemini image returned no inlineData (response: ' + JSON.stringify(body).slice(0, 200) + ')');
    }
    const texts = parts.filter(p => p.text).map(p => p.text);
    return { images, texts, raw: body };
  }
}

// --- Detailed visual concept brief (fallback when image quota is 0) -
// Instead of failing, produce a comprehensive design-direction document
// the customer (or a human designer) can act on immediately.
async function geminiImageConceptBrief(order) {
  const prompt = [
    'You are a senior art director. A client ordered a ' + (order.serviceName || order.serviceId) +
    ' (' + (order.packageName || 'Standard') + ' package) but automated image generation is',
    'temporarily unavailable. Produce a DETAILED visual concept brief that a designer (or AI image',
    'tool) can execute directly. Include:',
    '1. Creative concept (2-3 sentences)',
    '2. Composition & layout (focal point, rule-of-thirds, negative space)',
    '3. Color palette (hex codes + mood)',
    '4. Typography recommendations (font style, hierarchy, weight)',
    '5. Visual style / aesthetic references',
    '6. Exact AI-image-generation prompt (ready to paste into DALL-E/Midjourney/Gemini)',
    'Client brief: ' + (order.requirements || 'No specific brief — use creative judgement.'),
    'Return well-structured Markdown. Be specific and actionable.'
  ].join('\n');
  return await geminiTextRaw(prompt);
}

// Template-based concept brief — used when BOTH image gen AND text gen are
// unavailable (Gemini free-tier daily quota fully exhausted). No API calls.
function buildTemplateConceptBrief(order) {
  const svc = order.serviceName || order.serviceId || 'creative service';
  const pkg = order.packageName || 'Standard';
  const brief = order.requirements || 'No specific brief — using creative judgement.';
  return [
    `# Visual Concept Brief — ${svc} (${pkg} package)`,
    ``,
    `> **Note:** AI image generation is temporarily unavailable due to daily API quota limits. This template brief provides design direction you can execute manually or with any AI image tool once quota resets.`,
    ``,
    `## 1. Creative Concept`,
    `A professional ${svc.toLowerCase()} that captures the essence of the client's brief: "${brief.slice(0, 200)}". The design should feel modern, polished, and commercially ready, with clear visual hierarchy that guides the viewer's eye to the key message.`,
    ``,
    `## 2. Composition & Layout`,
    `- **Focal point:** Center-weighted subject with supporting elements arranged using the rule of thirds`,
    `- **Negative space:** Generous margins (at least 10% on all sides) for breathing room`,
    `- **Hierarchy:** Large headline → medium subheadline → small body text / CTA`,
    `- **Aspect ratio:** 1:1 for social media, 16:9 for video/web, 4:5 for Instagram`,
    ``,
    `## 3. Color Palette`,
    `- **Primary:** #1a1a2e (deep navy — authority, trust)`,
    `- **Accent:** #4ecca3 (CreatiHub green — energy, creativity)`,
    `- **Background:** #f8f9fa (clean off-white)`,
    `- **Text:** #2d2d44 (dark slate) on light, #ffffff on dark`,
    `- **Mood:** Professional, confident, approachable`,
    ``,
    `## 4. Typography`,
    `- **Headline:** Bold sans-serif (e.g., Montserrat, Poppins, or Inter Bold)`,
    `- **Subheadline:** Medium-weight sans-serif`,
    `- **Body:** Regular sans-serif for readability`,
    `- **Hierarchy:** Headline 48-72pt → Subheadline 24-32pt → Body 14-18pt`,
    ``,
    `## 5. Visual Style`,
    `Clean, modern design with flat or subtle gradient elements. Avoid clutter — let the message breathe. Use high-quality imagery or illustrations that directly relate to the subject matter. Maintain consistent spacing and alignment throughout.`,
    ``,
    `## 6. Ready-to-Use AI Image Prompt`,
    `\`\`\``,
    `Professional ${svc.toLowerCase()}, ${pkg.toLowerCase()} package quality. Client brief: ${brief.slice(0, 150)}. Clean, high-resolution, print-ready, commercially usable, no copyrighted logos or text watermarks. Modern design with clear visual hierarchy.`,
    `\`\`\``,
    ``,
    `*Generated by CreatiHub AI — template fallback mode (API quota will reset daily).*`
  ].join('\n');
}

// --- Gemini image generation deliverable ----------------------------
async function geminiImage(order) {
  const prompt = buildImagePrompt(order);
  const variants = ['primary', 'alt'];
  const out = [];

  for (const v of variants) {
    const fullPrompt = v === 'alt' ? prompt + ' (alternative concept, different composition)' : prompt;
    try {
      const result = await geminiImageRaw(fullPrompt);
      if (result.images && result.images.length) {
        const img = result.images[0];
        out.push({
          id: shortId('img'),
          kind: 'image',
          filename: `${order.id || 'order'}_${v}.png`,
          mime: img.mimeType || 'image/png',
          content: img.bytesBase64Encoded,
          encoding: 'base64',
          isDemo: false,
          summary: `Gemini image generated (${v}) for ${order.serviceName}`,
          provider: 'gemini',
          generatedAt: new Date().toISOString()
        });
      } else {
        throw new Error('No image in response');
      }
    } catch (imgErr) {
      // Image generation unavailable (free-tier 429 / quota 0 / overloaded).
      // Generate one comprehensive concept brief instead of failing.
      if (v === 'primary') {
        let brief;
        let briefProvider = 'gemini-concept';
        try {
          brief = await geminiImageConceptBrief(order);
        } catch (briefErr) {
          // Text generation also unavailable (quota exhausted) — use template
          brief = buildTemplateConceptBrief(order);
          briefProvider = 'template';
        }
        out.push({
          id: shortId('txt'),
          kind: 'text',
          filename: `${order.id || 'order'}_visual_concept_brief.md`,
          mime: 'text/markdown',
          content: brief,
          encoding: 'utf8',
          isDemo: false,
          summary: `Visual concept brief for ${order.serviceName} (${briefProvider === 'template' ? 'AI quota exhausted — template fallback' : 'image gen unavailable — includes ready-to-use AI prompt'})`,
          provider: briefProvider,
          generatedAt: new Date().toISOString()
        });
      }
      break; // one comprehensive brief is enough — skip alt variant
    }
  }
  return out;
}

// --- Gemini text deliverable ----------------------------------------
async function geminiText(order, kind) {
  const prompt = buildCopyPrompt(order, kind);
  const content = await geminiTextRaw(prompt);
  return [{
    id: shortId('txt'),
    kind: 'text',
    filename: `${order.id || 'order'}_${order.serviceId || 'copy'}.md`,
    mime: 'text/markdown',
    content,
    encoding: 'utf8',
    isDemo: false,
    summary: `Gemini-generated ${order.serviceName} copy (${GEMINI_TEXT_MODEL})`,
    provider: 'gemini',
    generatedAt: new Date().toISOString()
  }];
}

// --- Gemini translation deliverable ---------------------------------
async function geminiTranslation(order) {
  const text = (order.requirements || '').trim() || 'Translate this message.';
  const content = await geminiTextRaw(buildTranslationPrompt(order, text));
  return [{
    id: shortId('trn'),
    kind: 'text',
    filename: `${order.id || 'order'}_translation.md`,
    mime: 'text/markdown',
    content,
    encoding: 'utf8',
    isDemo: false,
    summary: `Gemini translation for ${order.serviceName} (${GEMINI_TEXT_MODEL})`,
    provider: 'gemini',
    generatedAt: new Date().toISOString()
  }];
}

// --- Gemini video (poster image + TTS narration -> real MP4) -------
// Generates a poster image + narration script, synthesizes TTS audio,
// then composes an actual playable MP4 video using ffmpeg (image shown
// for the duration of the audio track). Falls back to separate assets
// + manifest if ffmpeg is unavailable.
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function ffmpegAvailable() {
  try {
    require('child_process').execSync('ffmpeg -version', { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch { return false; }
}

// Generate a placeholder poster image using ffmpeg (no API needed).
// Creates a 1280x720 PNG with a gradient background and the service name text.
// Returns { content: base64, mime: 'image/png' } or null if ffmpeg fails.
function generatePlaceholderPoster(order) {
  return new Promise((resolve) => {
    if (!ffmpegAvailable()) { resolve(null); return; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chposter-'));
    const outPath = path.join(tmp, 'poster.png');
    const title = (order.serviceName || order.serviceId || 'CreatiHub').replace(/'/g, "\\'").replace(/:/g, '');
    const subtitle = ((order.requirements || '').slice(0, 80) || 'Professional Creative Services').replace(/'/g, "\\'").replace(/:/g, '');
    // ffmpeg drawtext: dark navy background with title/subtitle/brand text overlay.
    // IMPORTANT: multiple drawtext filters must be separated by COMMAS (filter chain),
    // not colons (which are option separators within a single drawtext filter).
    // Explicit fontfile path ensures text renders even when fontconfig isn't fully configured.
    const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
    const FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
    const filterStr =
      "drawtext=fontfile=" + FONT_BOLD + ":text='" + title + "':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h/2)-60," +
      "drawtext=fontfile=" + FONT_REG + ":text='" + subtitle + "':fontcolor=0x8888aa:fontsize=28:x=(w-text_w)/2:y=(h/2)+40," +
      "drawtext=fontfile=" + FONT_REG + ":text='CreatiHub':fontcolor=0x4ecca3:fontsize=24:x=(w-text_w)/2:y=h-50";
    const args = [
      '-y',
      '-f', 'lavfi', '-i', 'color=c=0x1a1a2e:s=1280x720:d=1',
      '-vf', filterStr,
      '-frames:v', '1',
      '-update', '1',
      outPath
    ];
    execFile('ffmpeg', args, { timeout: 30000 }, (err) => {
      if (err) {
        // drawtext might fail if no fonts — try simpler solid color
        execFile('ffmpeg', [
          '-y', '-f', 'lavfi', '-i', 'color=c=0x1a1a2e:s=1280x720:d=1',
          '-frames:v', '1', outPath
        ], { timeout: 30000 }, (err2) => {
          if (err2) { try { fs.rmSync(tmp, { recursive: true }); } catch {} resolve(null); return; }
          try {
            const buf = fs.readFileSync(outPath);
            try { fs.rmSync(tmp, { recursive: true }); } catch {}
            resolve({ content: buf.toString('base64'), mime: 'image/png' });
          } catch { try { fs.rmSync(tmp, { recursive: true }); } catch {} resolve(null); }
        });
        return;
      }
      try {
        const buf = fs.readFileSync(outPath);
        try { fs.rmSync(tmp, { recursive: true }); } catch {}
        resolve({ content: buf.toString('base64'), mime: 'image/png' });
      } catch { try { fs.rmSync(tmp, { recursive: true }); } catch {} resolve(null); }
    });
  });
}

// Compose an MP4 from a base64 image + base64 WAV/audio using ffmpeg.
// Returns base64-encoded MP4 or null if ffmpeg is missing/fails.
function composeVideoMp4(imgBase64, imgMime, audioBase64, audioMime) {
  return new Promise((resolve) => {
    if (!ffmpegAvailable()) { resolve(null); return; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chvid-'));
    const imgExt = (imgMime || 'image/png').includes('jpeg') || (imgMime || '').includes('jpg') ? '.jpg' : '.png';
    const audExt = (audioMime || '').includes('wav') ? '.wav' : (audioMime || '').includes('mpeg') ? '.mp3' : '.wav';
    const imgPath = path.join(tmp, 'poster' + imgExt);
    const audPath = path.join(tmp, 'audio' + audExt);
    const outPath = path.join(tmp, 'output.mp4');
    try {
      fs.writeFileSync(imgPath, Buffer.from(imgBase64, 'base64'));
      fs.writeFileSync(audPath, Buffer.from(audioBase64, 'base64'));
      // ffmpeg: loop the image for the audio duration, encode H.264 + AAC
      execFile('ffmpeg', [
        '-y', '-loop', '1', '-i', imgPath, '-i', audPath,
        '-c:v', 'libx264', '-tune', 'stillimage', '-c:a', 'aac',
        '-b:a', '192k', '-pix_fmt', 'yuv420p',
        '-shortest', '-movflags', '+faststart',
        outPath
      ], { timeout: 120000 }, (err) => {
        if (err) { try { fs.rmSync(tmp, { recursive: true }); } catch {} resolve(null); return; }
        try {
          const mp4 = fs.readFileSync(outPath);
          try { fs.rmSync(tmp, { recursive: true }); } catch {}
          resolve(mp4.toString('base64'));
        } catch {
          try { fs.rmSync(tmp, { recursive: true }); } catch {}
          resolve(null);
        }
      });
    } catch {
      try { fs.rmSync(tmp, { recursive: true }); } catch {}
      resolve(null);
    }
  });
}

async function geminiVideo(order) {
  const imageDeliverables = await geminiImage(order);

  // Generate narration script — try Gemini text, fall back to template if quota exhausted
  let script;
  try {
    script = await geminiTextRaw(buildNarrationScript(order) + '\n\nReturn only the narration text, 100-130 words.');
  } catch (textErr) {
    // Text generation quota exhausted — use a template-based script
    script = buildTemplateNarration(order);
  }

  // Generate TTS audio from the narration script
  let audioDeliverables = [];
  try {
    audioDeliverables = await geminiAudio(Object.assign({}, order, {
      requirements: script,
      serviceName: 'Voiceover for ' + (order.serviceName || order.serviceId)
    }));
  } catch (audioErr) {
    // TTS may fail on free tier — continue without audio
  }

  // Find the poster image — may be a real Gemini image or absent (quota exhausted)
  let posterImg = imageDeliverables.find(d => d.kind === 'image');
  const audioFile = audioDeliverables.find(d => d.kind === 'audio');
  const out = [...imageDeliverables, ...audioDeliverables];

  // If no real image was generated (quota exhausted), create a placeholder poster via ffmpeg
  if (!posterImg && audioFile) {
    const placeholder = await generatePlaceholderPoster(order);
    if (placeholder) {
      posterImg = {
        id: shortId('img'),
        kind: 'image',
        filename: `${order.id || 'order'}_poster_placeholder.png`,
        mime: placeholder.mime,
        content: placeholder.content,
        encoding: 'base64',
        isDemo: false,
        summary: `Placeholder poster (AI image quota exceeded — will reset daily). Text: ${order.serviceName}`,
        provider: 'ffmpeg-placeholder',
        generatedAt: new Date().toISOString()
      };
      out.push(posterImg);
    }
  }

  // Try to compose a real MP4 from poster + audio
  if (posterImg && audioFile) {
    const mp4Base64 = await composeVideoMp4(
      posterImg.content, posterImg.mime,
      audioFile.content, audioFile.mime
    );
    if (mp4Base64) {
      out.unshift({
        id: shortId('vid'),
        kind: 'video',
        filename: `${order.id || 'order'}_video.mp4`,
        mime: 'video/mp4',
        content: mp4Base64,
        encoding: 'base64',
        isDemo: false,
        summary: 'Playable MP4 video — poster image + AI narration (Gemini TTS + ffmpeg)',
        provider: posterImg.provider === 'ffmpeg-placeholder' ? 'gemini-tts+ffmpeg' : 'gemini',
        meta: { script, posterSource: posterImg.provider },
        generatedAt: new Date().toISOString()
      });
      return out;
    }
  }

  // Fallback: text manifest if MP4 composition wasn't possible
  const manifest = `# Video Production Manifest — Order ${order.id}\n\n## Voiceover Script\n${script}\n\n## Poster\nSee attached image asset (Gemini image, or concept brief if on free tier).\n\n## Audio\nSee attached voiceover file (Gemini TTS) if available.\n\n## Scene Plan\n1. Title card\n2. Voiceover over poster\n3. CTA outro\n\n## Note\nFull MP4 rendering requires ffmpeg. Individual assets (poster + audio) are included above and can be combined in any video editor.`;
  out.push({
    id: shortId('vid'),
    kind: 'text',
    filename: `${order.id || 'order'}_video_manifest.md`,
    mime: 'text/markdown',
    content: manifest,
    encoding: 'utf8',
    isDemo: false,
    summary: 'Video assets (poster + script + audio) + scene manifest (Gemini)',
    provider: 'gemini',
    meta: { script },
    generatedAt: new Date().toISOString()
  });
  return out;
}

// --- PCM-to-WAV converter ------------------------------------------
// Gemini TTS returns raw PCM (audio/l16; rate=24000) — 16-bit signed
// little-endian samples. We wrap a standard WAV header around the raw
// PCM bytes so the customer gets a universally playable .wav file.
// No external library needed — just a 44-byte header.
function pcmToWavBuffer(pcmBuffer, sampleRate, numChannels) {
  const rate = sampleRate || 24000;
  const channels = numChannels || 1;
  const bitsPerSample = 16;
  const blockAlign = channels * (bitsPerSample / 8);
  const byteRate = rate * blockAlign;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);                       // "RIFF" chunk descriptor
  header.writeUInt32LE(36 + dataSize, 4);         // file size - 8
  header.write('WAVE', 8);                        // "WAVE" format
  header.write('fmt ', 12);                       // "fmt " subchunk
  header.writeUInt32LE(16, 16);                   // subchunk1 size (PCM)
  header.writeUInt16LE(1, 20);                    // audio format = PCM
  header.writeUInt16LE(channels, 22);             // num channels
  header.writeUInt32LE(rate, 24);                 // sample rate
  header.writeUInt32LE(byteRate, 28);             // byte rate
  header.writeUInt16LE(blockAlign, 32);           // block align
  header.writeUInt16LE(bitsPerSample, 34);        // bits per sample
  header.write('data', 36);                       // "data" subchunk
  header.writeUInt32LE(dataSize, 40);             // data size

  return Buffer.concat([header, pcmBuffer]);
}

// --- Gemini TTS audio generation -----------------------------------
// Uses gemini-3.1-flash-tts-preview via generateContent with
// responseModalities: ['AUDIO']. The model returns raw PCM (audio/l16;
// rate=24000) which we convert to WAV with pcmToWavBuffer().
// Body: { contents:[{parts:[{text:"..."}]}], generationConfig:{
//   responseModalities:['AUDIO'], speechConfig:{ voiceConfig:{
//     prebuiltVoiceConfig:{ voiceName:'Kore' }}}}}
// Response part: { inlineData:{ mimeType:'audio/l16;rate=24000', data } }
async function geminiAudio(order) {
  // Use the provided script from order.requirements if available,
  // otherwise generate one via Gemini text. This avoids a redundant
  // text API call (which may fail due to quota) when the caller already
  // has a script (e.g., geminiVideo passes the narration script here).
  let script;
  if (order.requirements && order.requirements.trim().length > 20) {
    // Caller provided a script — use it directly
    script = order.requirements.trim();
  } else {
    const scriptPrompt = buildNarrationScript(order) +
      '\n\nReturn only the narration text, 100-130 words, ready for text-to-speech.';
    try {
      script = await geminiTextRaw(scriptPrompt);
    } catch (textErr) {
      // Text generation quota exhausted — use template narration
      script = buildTemplateNarration(order);
    }
  }

  // Choose a voice. Gemini prebuilt voices: Kore, Puck, Zephyr, Aoede,
  // Charon, Fenrir, Leda, Orus. Default Kore (neutral, professional).
  const voiceName = process.env.GEMINI_TTS_VOICE || 'Kore';

  const body = await geminiPost(`/models/${GEMINI_TTS_MODEL}:generateContent`, {
    contents: [{ parts: [{ text: script }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  });

  const parts = body.candidates && body.candidates[0] && body.candidates[0].content &&
               body.candidates[0].content.parts;
  if (!parts || !parts.length) {
    throw new Error('Gemini TTS returned no audio parts (response: ' + JSON.stringify(body).slice(0, 200) + ')');
  }
  const audioPart = parts.find(p => p.inlineData && p.inlineData.data);
  if (!audioPart) {
    throw new Error('Gemini TTS response missing inlineData (response: ' + JSON.stringify(body).slice(0, 200) + ')');
  }

  // Parse sample rate from mimeType (e.g. "audio/l16;rate=24000")
  const mimeStr = audioPart.inlineData.mimeType || 'audio/l16;rate=24000';
  const rateMatch = mimeStr.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

  const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
  const wavBuffer = pcmToWavBuffer(pcmBuffer, sampleRate, 1);

  return [{
    id: shortId('aud'),
    kind: 'audio',
    filename: `${order.id || 'order'}_voiceover.wav`,
    mime: 'audio/wav',
    content: wavBuffer.toString('base64'),
    encoding: 'base64',
    isDemo: false,
    summary: `Gemini TTS voiceover (voice: ${voiceName}, ${sampleRate}Hz) — script included`,
    provider: 'gemini',
    meta: { script, voice: voiceName, sampleRate },
    generatedAt: new Date().toISOString()
  }];
}

// ====================================================================
// OPENAI GENERATORS
// ====================================================================

async function openaiTextRaw(prompt) {
  const body = await openaiPost('/chat/completions', {
    model: MODEL_TEXT,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });
  return body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content || '';
}

async function openaiImage(order) {
  const prompt = buildImagePrompt(order);
  const variants = ['primary', 'alt'];
  const out = [];
  for (const v of variants) {
    const body = await openaiPost('/images/generations', {
      model: MODEL_IMAGE,
      prompt: v === 'alt' ? prompt + ' (alternative concept)' : prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    });
    const b64 = body.data && body.data[0] && body.data[0].b64_json;
    if (!b64) throw new Error('No image data in OpenAI response');
    out.push({
      id: shortId('img'),
      kind: 'image',
      filename: `${order.id || 'order'}_${v}.png`,
      mime: 'image/png',
      content: b64,
      encoding: 'base64',
      isDemo: false,
      summary: `DALL-E 3 generated image (${v}) for ${order.serviceName}`,
      provider: 'openai',
      generatedAt: new Date().toISOString()
    });
  }
  return out;
}

async function openaiAudio(order) {
  const script = await openaiTextRaw(buildNarrationScript(order) + '\n\nReturn only the narration text, 100-130 words.');
  const voice = TTS_VOICE;
  const buf = await openaiRawPost('/audio/speech', {
    model: 'tts-1',
    voice,
    input: script.slice(0, 4000),
    response_format: 'mp3'
  });
  return [
    {
      id: shortId('aud'),
      kind: 'audio',
      filename: `${order.id || 'order'}_voiceover.mp3`,
      mime: 'audio/mpeg',
      content: buf.toString('base64'),
      encoding: 'base64',
      isDemo: false,
      summary: `OpenAI TTS voiceover (${voice}) — script included`,
      provider: 'openai',
      meta: { script },
      generatedAt: new Date().toISOString()
    }
  ];
}

async function openaiText(order, kind) {
  const prompt = buildCopyPrompt(order, kind);
  const content = await openaiTextRaw(prompt);
  return [{
    id: shortId('txt'),
    kind: 'text',
    filename: `${order.id || 'order'}_${order.serviceId || 'copy'}.md`,
    mime: 'text/markdown',
    content,
    encoding: 'utf8',
    isDemo: false,
    summary: `AI-generated ${order.serviceName} copy (${MODEL_TEXT})`,
    provider: 'openai',
    generatedAt: new Date().toISOString()
  }];
}

async function openaiTranslation(order) {
  const text = (order.requirements || '').trim() || 'Translate this message.';
  const content = await openaiTextRaw(buildTranslationPrompt(order, text));
  return [{
    id: shortId('trn'),
    kind: 'text',
    filename: `${order.id || 'order'}_translation.md`,
    mime: 'text/markdown',
    content,
    encoding: 'utf8',
    isDemo: false,
    summary: `AI translation for ${order.serviceName} (${MODEL_TEXT})`,
    provider: 'openai',
    generatedAt: new Date().toISOString()
  }];
}

async function openaiVideo(order) {
  const audioDeliverables = await openaiAudio(order);
  const imageDeliverables = await openaiImage(order);

  // Try to compose a real MP4 from poster + audio
  const posterImg = imageDeliverables.find(d => d.kind === 'image');
  const audioFile = audioDeliverables.find(d => d.kind === 'audio');
  if (posterImg && audioFile) {
    const mp4Base64 = await composeVideoMp4(
      posterImg.content, posterImg.mime,
      audioFile.content, audioFile.mime
    );
    if (mp4Base64) {
      return [
        {
          id: shortId('vid'),
          kind: 'video',
          filename: `${order.id || 'order'}_video.mp4`,
          mime: 'video/mp4',
          content: mp4Base64,
          encoding: 'base64',
          isDemo: false,
          summary: 'Playable MP4 video — poster image + AI narration (OpenAI + ffmpeg)',
          provider: 'openai',
          generatedAt: new Date().toISOString()
        },
        ...audioDeliverables,
        ...imageDeliverables
      ];
    }
  }

  // Fallback: manifest if MP4 composition wasn't possible
  const manifest = `# Video Production Manifest — Order ${order.id}\n\n## Voiceover\nSee attached MP3 (OpenAI TTS).\n\n## Poster\nSee attached PNG (DALL-E 3).\n\n## Scene Plan\n1. Title card\n2. Voiceover over poster\n3. CTA outro\n\n## Note\nFull MP4 rendering requires ffmpeg; individual assets are included above.`;
  return [
    ...audioDeliverables,
    ...imageDeliverables,
    {
      id: shortId('vid'),
      kind: 'text',
      filename: `${order.id || 'order'}_video_manifest.md`,
      mime: 'text/markdown',
      content: manifest,
      encoding: 'utf8',
      isDemo: false,
      summary: 'Video assets (narration + poster) + scene manifest (OpenAI)',
      provider: 'openai',
      generatedAt: new Date().toISOString()
    }
  ];
}

// ====================================================================
// TEMPLATE-BASED HTML DELIVERABLES (website / chatbot)
// ====================================================================

function buildWebsiteTemplate(order) {
  const svc = order.serviceName || 'Website';
  const req = order.requirements || 'A modern, responsive landing page.';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeXml(svc)}</title>
<style>
  :root { --accent: #6c5ce7; --bg: #0f1020; --card: #1a1b32; --text: #eef0ff; --muted: #9aa0c0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); }
  header { padding: 1.2rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .brand { font-weight: 800; font-size: 1.3rem; color: var(--accent); }
  nav a { color: var(--muted); text-decoration: none; margin-left: 1.2rem; }
  nav a:hover { color: var(--text); }
  .hero { padding: 5rem 2rem; text-align: center; }
  .hero h1 { font-size: clamp(2rem, 6vw, 3.5rem); margin-bottom: 1rem; }
  .hero p { color: var(--muted); max-width: 560px; margin: 0 auto 2rem; }
  .btn { background: var(--accent); color: #fff; padding: .9rem 1.8rem; border-radius: 999px; text-decoration: none; font-weight: 600; }
  .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; padding: 3rem 2rem; max-width: 1000px; margin: 0 auto; }
  .card { background: var(--card); padding: 1.8rem; border-radius: 16px; }
  .card h3 { margin-bottom: .5rem; }
  .card p { color: var(--muted); }
  footer { text-align: center; padding: 2rem; color: var(--muted); border-top: 1px solid rgba(255,255,255,0.08); }
</style>
</head>
<body>
<header>
  <div class="brand">${escapeXml(svc)}</div>
  <nav><a href="#features">Features</a><a href="#cta">Get Started</a></nav>
</header>
<section class="hero">
  <h1>${escapeXml(svc)}</h1>
  <p>${escapeXml(req)}</p>
  <a class="btn" href="#cta">Get Started</a>
</section>
<section class="features" id="features">
  <div class="card"><h3>Fast</h3><p>Built for speed and performance out of the box.</p></div>
  <div class="card"><h3>Responsive</h3><p>Looks great on every screen size.</p></div>
  <div class="card"><h3>SEO-ready</h3><p>Clean markup and meta tags included.</p></div>
</section>
<footer>&copy; ${new Date().getFullYear()} ${escapeXml(svc)} — Built by CreatiHub AI</footer>
</body>
</html>`;
  return html;
}

function buildChatbotTemplate(order) {
  const svc = order.serviceName || 'AI Chatbot';
  const req = order.requirements || 'A friendly FAQ chatbot widget.';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeXml(svc)} — Widget</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #f4f5fb; margin: 0; padding: 2rem; }
  h1 { color: #2d2d44; }
  p { color: #555; }
  #chat { position: fixed; bottom: 20px; right: 20px; width: 320px; background: #fff; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.15); overflow: hidden; font-size: 14px; }
  #chat header { background: #6c5ce7; color: #fff; padding: 12px 16px; font-weight: 600; }
  #messages { padding: 12px 16px; height: 260px; overflow-y: auto; }
  .msg { margin: 8px 0; }
  .bot { color: #333; } .you { color: #6c5ce7; text-align: right; }
  #input { display: flex; border-top: 1px solid #eee; }
  #input input { flex: 1; border: 0; padding: 12px; outline: none; }
  #input button { background: #6c5ce7; color: #fff; border: 0; padding: 0 16px; }
</style>
</head>
<body>
<h1>${escapeXml(svc)}</h1>
<p>${escapeXml(req)}</p>
<p><em>Configure your knowledge base and deploy this widget to your site.</em></p>
<div id="chat">
  <header>Nova Assistant</header>
  <div id="messages"><div class="msg bot">Hi! Ask me anything about ${escapeXml(svc)}.</div></div>
  <div id="input"><input id="q" placeholder="Type a question..."><button onclick="send()">Send</button></div>
</div>
<script>
  const faqs = [
    { q: /hours|open/i, a: 'We are available 24/7 online.' },
    { q: /price|cost/i, a: 'Pricing depends on the package — see our services page.' },
    { q: /contact|support/i, a: 'You can reach us via the chat widget or email.' },
    { q: /hello|hi/i, a: 'Hello! How can I help you today?' }
  ];
  function send() {
    const v = document.getElementById('q').value.trim();
    if (!v) return;
    const m = document.getElementById('messages');
    m.innerHTML += '<div class="msg you">' + v + '</div>';
    const hit = faqs.find(f => f.q.test(v));
    m.innerHTML += '<div class="msg bot">' + (hit ? hit.a : 'Thanks for your message! A team member will follow up shortly.') + '</div>';
    document.getElementById('q').value = '';
    m.scrollTop = m.scrollHeight;
  }
  document.getElementById('q').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
</script>
</body>
</html>`;
  return html;
}

function htmlDeliverable(order) {
  if (order.serviceId === 'ai-chatbot') {
    return [{
      id: shortId('html'),
      kind: 'html',
      filename: `${order.id || 'order'}_chatbot.html`,
      mime: 'text/html',
      content: buildChatbotTemplate(order),
      encoding: 'utf8',
      isDemo: false,
      summary: 'AI chatbot widget embed (template-based)',
      provider: 'template',
      generatedAt: new Date().toISOString()
    }];
  }
  return [{
    id: shortId('html'),
    kind: 'html',
    filename: `${order.id || 'order'}_website.html`,
    mime: 'text/html',
    content: buildWebsiteTemplate(order),
    encoding: 'utf8',
    isDemo: false,
    summary: 'Website template (deployable starting point)',
    provider: 'template',
    generatedAt: new Date().toISOString()
  }];
}

// ====================================================================
// DISPATCHER
// ====================================================================

// generate(order) is the single entry point. It inspects the service id
// and routes to the right generator, auto-selecting the best provider.
async function generate(order) {
  if (!order || !order.serviceId) throw new Error('Order is missing serviceId');
  if (!IS_LIVE) {
    throw new Error(
      'AI generation engine is not configured. Set GEMINI_API_KEY (free, from aistudio.google.com) and/or OPENAI_API_KEY to enable automatic deliverable generation.'
    );
  }
  const kind = SERVICE_KIND[order.serviceId] || 'text';
  let deliverables;

  switch (kind) {
    case 'image':
      deliverables = HAS_OPENAI ? await openaiImage(order) : await geminiImage(order);
      break;

    case 'audio':
      // Audio: OpenAI TTS if available, else Gemini TTS (Phase 7b).
      if (!HAS_OPENAI && !HAS_GEMINI) {
        throw new Error(
          'Audio generation (voiceover / music jingles) requires an AI key. ' +
          'Set GEMINI_API_KEY (free, includes TTS via gemini-3.1-flash-tts-preview) ' +
          'or OPENAI_API_KEY to enable audio generation.'
        );
      }
      deliverables = HAS_OPENAI ? await openaiAudio(order) : await geminiAudio(order);
      break;

    case 'text':
      deliverables = HAS_OPENAI ? await openaiText(order, order.serviceId) : await geminiText(order, order.serviceId);
      break;

    case 'translation':
      deliverables = HAS_OPENAI ? await openaiTranslation(order) : await geminiTranslation(order);
      break;

    case 'video':
      deliverables = HAS_OPENAI ? await openaiVideo(order) : await geminiVideo(order);
      break;

    case 'html':
      deliverables = htmlDeliverable(order);
      break;

    default:
      deliverables = HAS_OPENAI ? await openaiText(order, order.serviceId) : await geminiText(order, order.serviceId);
  }

  return { deliverables, mode: 'live' };
}

// ---------------- Raw text generation (for training lessons & email drafting) -
// Exposed so the training academy and admin email system can reuse the same
// provider auto-detection (Gemini free-tier → OpenAI paid) without duplicating
// API call logic.
async function generateTextRaw(prompt, { temperature, maxTokens } = {}) {
  if (HAS_OPENAI) {
    const body = await openaiPost('/chat/completions', {
      model: MODEL_TEXT,
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature ?? 0.7
    });
    return body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content || '';
  }
  if (HAS_GEMINI) {
    const body = await geminiPost(`/models/${GEMINI_TEXT_MODEL}:generateContent`, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: temperature ?? 0.7, maxOutputTokens: maxTokens ?? 8192 }
    });
    const text = body.candidates && body.candidates[0] && body.candidates[0].content &&
                 body.candidates[0].content.parts && body.candidates[0].content.parts[0] &&
                 body.candidates[0].content.parts[0].text;
    if (!text) throw new Error('Gemini returned no text (response: ' + JSON.stringify(body).slice(0, 200) + ')');
    return text;
  }
  throw new Error('No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY.');
}

function aiProviderLabel() {
  if (HAS_OPENAI) return 'OpenAI GPT-4o';
  if (HAS_GEMINI) return 'Gemini ' + GEMINI_TEXT_MODEL;
  return 'none';
}

// ====================================================================
// DIAGNOSTIC FUNCTION — exposes raw Gemini API errors for debugging
// ====================================================================
// Calls the Interactions API directly with a simple prompt and returns
// the raw HTTP status, response body, and any error message. NO fallback.
// This lets the admin debug why image generation is failing on Railway.
async function diagnoseImage(prompt) {
  const testPrompt = prompt || 'A simple red circle on a white background';
  const result = {
    timestamp: new Date().toISOString(),
    config: {
      GEMINI_BASE,
      GEMINI_IMAGE_MODEL,
      GEMINI_TTS_MODEL,
      GEMINI_TEXT_MODEL,
      HAS_GEMINI: HAS_GEMINI,
      GEMINI_API_KEY_length: GEMINI_API_KEY.length,
      GEMINI_API_KEY_prefix: GEMINI_API_KEY.slice(0, 6) + '...'
    },
    interactions: { status: null, ok: null, error: null, bodyPreview: null },
    generateContent: { status: null, ok: null, error: null, bodyPreview: null, attempted: false },
    tts: { status: null, ok: null, error: null, bodyPreview: null, attempted: false },
    text: { status: null, ok: null, error: null, bodyPreview: null, attempted: true }
  };

  // --- Test 1: Interactions API (image generation) ---
  try {
    const body = await geminiPostOnce('/interactions', {
      model: GEMINI_IMAGE_MODEL,
      input: [{ type: 'text', text: testPrompt }]
    });
    result.interactions.ok = true;
    result.interactions.status = 200;
    if (body.output_image && body.output_image.data) {
      result.interactions.hasImage = true;
      result.interactions.imageDataLength = body.output_image.data.length;
      result.interactions.mimeType = body.output_image.mime_type;
    } else if (Array.isArray(body.steps)) {
      const imgBlock = body.steps.flatMap(s => (s.content || [])).find(b => b.type === 'image' && b.data);
      if (imgBlock) {
        result.interactions.hasImage = true;
        result.interactions.imageDataLength = imgBlock.data.length;
        result.interactions.mimeType = imgBlock.mime_type;
      }
    }
    if (!result.interactions.hasImage) {
      result.interactions.hasImage = false;
    }
    result.interactions.bodyPreview = JSON.stringify(body).slice(0, 500);
  } catch (e) {
    result.interactions.ok = false;
    result.interactions.error = String(e.message || e);
    const m = String(e.message).match(/HTTP (\d+)/);
    if (m) result.interactions.status = parseInt(m[1], 10);
  }

  // --- Test 2: Legacy generateContent with responseModalities (image) ---
  result.generateContent.attempted = true;
  try {
    const body = await geminiPostOnce(`/models/${GEMINI_IMAGE_MODEL}:generateContent`, {
      contents: [{ parts: [{ text: testPrompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 8192,
        responseModalities: ['TEXT', 'IMAGE']
      }
    });
    result.generateContent.ok = true;
    result.generateContent.status = 200;
    const parts = body.candidates && body.candidates[0] && body.candidates[0].content &&
                 body.candidates[0].content.parts;
    result.generateContent.hasImage = !!(parts && parts.some(p => p.inlineData && p.inlineData.data));
    result.generateContent.bodyPreview = JSON.stringify(body).slice(0, 500);
  } catch (e) {
    result.generateContent.ok = false;
    result.generateContent.error = String(e.message || e);
    const m = String(e.message).match(/HTTP (\d+)/);
    if (m) result.generateContent.status = parseInt(m[1], 10);
  }

  // --- Test 3: TTS audio generation ---
  result.tts.attempted = true;
  try {
    const body = await geminiPostOnce(`/models/${GEMINI_TTS_MODEL}:generateContent`, {
      contents: [{ parts: [{ text: 'Hello, this is a test of the text to speech system.' }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });
    result.tts.ok = true;
    result.tts.status = 200;
    const parts = body.candidates && body.candidates[0] && body.candidates[0].content &&
                 body.candidates[0].content.parts;
    result.tts.hasAudio = !!(parts && parts.some(p => p.inlineData && p.inlineData.data));
    result.tts.bodyPreview = JSON.stringify(body).slice(0, 500);
  } catch (e) {
    result.tts.ok = false;
    result.tts.error = String(e.message || e);
    const m = String(e.message).match(/HTTP (\d+)/);
    if (m) result.tts.status = parseInt(m[1], 10);
  }

  // --- Test 4: Plain text generation (sanity check) ---
  try {
    const body = await geminiPostOnce(`/models/${GEMINI_TEXT_MODEL}:generateContent`, {
      contents: [{ parts: [{ text: 'Say hello in one word.' }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
    });
    result.text.ok = true;
    result.text.status = 200;
    const parts = body.candidates && body.candidates[0] && body.candidates[0].content &&
                 body.candidates[0].content.parts;
    result.text.responseText = parts ? parts.map(p => p.text).filter(Boolean).join('') : '';
    result.text.bodyPreview = JSON.stringify(body).slice(0, 500);
  } catch (e) {
    result.text.ok = false;
    result.text.error = String(e.message || e);
    const m = String(e.message).match(/HTTP (\d+)/);
    if (m) result.text.status = parseInt(m[1], 10);
  }

  return result;
}

module.exports = {
  generate,
  SERVICE_KIND,
  IS_LIVE,
  modeLabel,
  PROVIDER,
  generateTextRaw,
  aiProviderLabel,
  diagnoseImage
};
