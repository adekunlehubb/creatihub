// ============================================================
// CreatiHub AI Engine
// - User assistant: service recommendations, pricing, order help
// - Admin assistant: business analytics, insights, management
// - AI safety filter: blocks prompt injection, blocked topics, PII
// ============================================================
// Use the SAME backend as server.js so Nova AI reads/writes the real data store
// whether we're on the JSON-file backend or PostgreSQL (DATABASE_URL set).
const _dbBackend = process.env.DATABASE_URL ? require('./db-pg') : require('./db');
const { getDb, logAiActivity, aiAuditLog } = _dbBackend;

const CURRENCY_RATES = {
  USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1550, INR: 83.2, KES: 129,
  ZAR: 18.4, CAD: 1.36, AUD: 1.52, AED: 3.67, BRL: 5.05, PHP: 58.5
};
const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', INR: '₹', KES: 'KSh ',
  ZAR: 'R', CAD: 'C$', AUD: 'A$', AED: 'د.إ', BRL: 'R$', PHP: '₱'
};

function convertPrice(usd, currency) {
  const rate = CURRENCY_RATES[currency] || 1;
  const sym = CURRENCY_SYMBOLS[currency] || '$';
  const val = usd * rate;
  const rounded = val >= 100 ? Math.round(val) : Math.round(val * 100) / 100;
  return sym + rounded.toLocaleString();
}

function findServices(query) {
  const db = getDb();
  const q = query.toLowerCase();
  const keywords = {
    'flyer-design': ['flyer', 'poster', 'banner', 'brochure', 'leaflet', 'print'],
    'automated-video': ['video', 'reel', 'animation', 'promo', 'ad', 'youtube', 'tiktok', 'intro', 'edit'],
    'cartoon-maker': ['cartoon', 'avatar', 'caricature', 'mascot', 'portrait', 'character', 'drawing'],
    'logo-design': ['logo', 'brand', 'identity', 'branding'],
    'social-media-kit': ['social', 'instagram', 'facebook', 'post', 'story', 'content'],
    'voiceover': ['voice', 'voiceover', 'narration', 'audio', 'podcast', 'dubbing'],
    'website-design': ['website', 'web', 'landing', 'page', 'site'],
    'seo-copywriting': ['seo', 'blog', 'article', 'copy', 'writing', 'content writing'],
    'ai-chatbot': ['chatbot', 'bot', 'automation', 'whatsapp'],
    'product-photography': ['product photo', 'product photography', 'photography', 'photo shoot', 'ecommerce', 'amazon', 'shopify', 'product image'],
    'music-jingles': ['music', 'jingle', 'song', 'soundtrack', 'background music', 'audio branding', 'theme song'],
    'pitch-deck': ['pitch', 'deck', 'presentation', 'slides', 'investor', 'powerpoint', 'keynote'],
    'pro-headshots': ['headshot', 'professional photo', 'linkedin photo', 'corporate photo', 'portrait photo', 'profile photo'],
    'youtube-thumbnails': ['thumbnail', 'youtube thumbnail', 'ctr', 'click'],
    'merch-tshirt': ['tshirt', 't-shirt', 'merch', 'merchandise', 'print on demand', 'hoodie', 'apparel'],
    'book-cover': ['book', 'cover', 'ebook', 'e-book', 'kindle', 'kdp', 'paperback', 'author', 'publishing'],
    'translation': ['translate', 'translation', 'localization', 'language', 'subtitle', 'localize', 'spanish', 'french', 'arabic'],
    'email-campaign': ['email', 'newsletter', 'campaign', 'mailchimp', 'klaviyo', 'email marketing'],
    'virtual-staging': ['staging', 'real estate', 'interior', 'property', 'furniture', 'room', 'home']
  };
  const matches = [];
  for (const svc of db.services) {
    let score = 0;
    if (svc.name.toLowerCase().includes(q) || svc.category.toLowerCase().includes(q)) score += 3;
    for (const [id, words] of Object.entries(keywords)) {
      if (id === svc.id && words.some(w => q.includes(w))) score += 2;
    }
    if (score > 0) matches.push({ ...svc, score });
  }
  return matches.sort((a, b) => b.score - a.score);
}

// ---------------- USER ASSISTANT ----------------
function userAssistant(message, user) {
  const db = getDb();
  const q = message.toLowerCase().trim();
  const cur = (user && user.currency) || 'USD';
  const name = user ? user.name.split(' ')[0] : 'there';

  // Greetings
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|yo|hola)\b/.test(q)) {
    return {
      reply: `Hello ${name}! 👋 I'm **Nova**, your CreatiHub AI assistant. I can help you:\n\n• Find the perfect service (flyers, videos, cartoons, logos & more)\n• Compare packages & prices in your currency\n• Track your orders\n• Answer questions about delivery & revisions\n\nWhat would you like to create today?`,
      suggestions: ['Show me all services', 'I need a flyer', 'How much is a video?', 'Track my order']
    };
  }

  // Track orders
  if (/track|order status|my order|where is my/.test(q)) {
    if (!user) return { reply: 'Please log in first so I can look up your orders. You can log in from the Account page.', suggestions: ['Show services'] };
    const orders = db.orders.filter(o => o.userId === user.id);
    if (!orders.length) return { reply: `You don't have any orders yet, ${name}. Would you like me to recommend a service to get started?`, suggestions: ['Show me all services', 'I need a logo'] };
    const lines = orders.slice(0, 5).map(o => {
      const emoji = { pending: '🕐', in_progress: '⚙️', completed: '✅', cancelled: '❌' }[o.status] || '📦';
      return `${emoji} **${o.id}** — ${o.serviceName} (${o.packageName}) — *${o.status.replace('_', ' ')}*`;
    });
    return { reply: `Here are your recent orders:\n\n${lines.join('\n')}\n\nYou can see full details in your Dashboard.`, suggestions: ['Show me all services', 'I need something else'] };
  }

  // Pricing questions
  const priceMatch = /price|cost|how much|cheap|expensive|pricing/.test(q);
  const matches = findServices(q);

  if (matches.length > 0) {
    const svc = matches[0];
    const pkgs = svc.packages.map(p => `• **${p.name}** — ${convertPrice(p.price, cur)}: ${p.desc}`).join('\n');
    if (priceMatch || matches.length === 1 || /need|want|looking|create|make|get/.test(q)) {
      return {
        reply: `Great choice! Here's **${svc.name}** ${svc.icon}\n\n${svc.tagline}.\n\n**Packages (in ${cur}):**\n${pkgs}\n\n⏱️ Average delivery: **${svc.deliveryDays} day(s)** • ⭐ Rated ${svc.rating}/5 (${svc.orders}+ orders)\n\nWould you like to order this service?`,
        suggestions: [`Order ${svc.name}`, 'Compare with other services', 'Show me all services'],
        serviceId: svc.id
      };
    }
  }

  // List all services
  if (/all services|show.*service|what.*(offer|do you)|list|catalog|everything/.test(q)) {
    const list = db.services.map(s => `${s.icon} **${s.name}** — from ${convertPrice(s.packages[0].price, cur)}`).join('\n');
    return {
      reply: `Here's everything CreatiHub offers worldwide 🌍\n\n${list}\n\nTell me which one interests you, or describe your project and I'll recommend the best fit!`,
      suggestions: ['I need a flyer', 'I need a video', 'I need a cartoon avatar', 'I need a website']
    };
  }

  // Delivery / revisions / payment FAQs
  if (/deliver|how long|turnaround|fast|deadline/.test(q)) {
    return { reply: `Delivery times depend on the service:\n\n• 🎙️ Voiceovers & 🌍 translations: ~24 hours\n• 📸 Product photos & 🤳 headshots: ~24 hours\n• 🎨 Flyers, cartoons & 👕 merch: ~2 days\n• 🎬 Videos & 📧 email campaigns: ~2-3 days\n• 📊 Pitch decks & 📖 book covers: ~3 days\n• 💻 Websites: ~5 days\n\nPremium packages include **priority delivery**. Every order shows a live status tracker in your dashboard!`, suggestions: ['Show me all services', 'Track my order'] };
  }
  if (/revision|change|edit|refund|guarantee/.test(q)) {
    return { reply: `Every package includes free revision rounds (Premium = unlimited!). If you're not happy after revisions, we offer a **satisfaction guarantee** — contact support from your dashboard and we'll make it right or refund you.`, suggestions: ['Show me all services'] };
  }
  if (/pay|payment|card|paypal|crypto|method/.test(q)) {
    return { reply: `We accept payments worldwide 🌍\n\n• 💳 Credit/Debit cards (Visa, Mastercard, Amex)\n• 🅿️ PayPal\n• 🏦 Bank transfer (selected regions)\n• ₿ Crypto (BTC, USDT)\n\nAll prices automatically convert to your local currency. Checkout is 100% secure.`, suggestions: ['Show me all services', 'What currencies do you support?'] };
  }
  if (/currenc|country|worldwide|international|global|language/.test(q)) {
    return { reply: `CreatiHub serves **every country worldwide**! 🌍\n\n• Prices shown in 12 currencies (USD, EUR, GBP, NGN, INR, KES, ZAR, CAD, AUD, AED, BRL, PHP)\n• AI voiceovers in 40+ languages\n• 24/7 support in English, Spanish, French, Arabic & Portuguese\n\nYour currency is currently set to **${cur}** — you can change it anytime from the top menu.`, suggestions: ['Show me all services'] };
  }
  if (/thank|thanks|great|awesome|cool/.test(q)) {
    return { reply: `You're very welcome, ${name}! 😊 I'm here 24/7 whenever you need help. Ready to create something amazing?`, suggestions: ['Show me all services', 'Track my order'] };
  }

  // Fallback — try to be helpful
  if (matches.length > 1) {
    const list = matches.slice(0, 3).map(s => `${s.icon} **${s.name}** — from ${convertPrice(s.packages[0].price, cur)}`).join('\n');
    return { reply: `Based on what you said, these services might fit:\n\n${list}\n\nWhich one would you like to explore?`, suggestions: matches.slice(0, 3).map(s => `Tell me about ${s.name}`) };
  }
  return {
    reply: `I want to make sure I help you right! I can assist with:\n\n• 🎨 **Design** — flyers, logos, social kits, thumbnails, merch\n• 🎬 **Video & Audio** — automated promos, voiceovers, music & jingles\n• 📸 **Photography** — product shoots, professional headshots, staging\n• 💻 **Web & AI** — websites, chatbots, translation\n• ✍️ **Writing & Business** — SEO content, pitch decks, email campaigns, book covers\n\nTry describing your project, e.g. *"I need a promo video for my restaurant"*`,
    suggestions: ['Show me all services', 'How much is a logo?', 'Track my order']
  };
}

// ---------------- ADMIN ASSISTANT ----------------
function adminAssistant(message) {
  const db = getDb();
  const q = message.toLowerCase().trim();
  const orders = db.orders;
  const users = db.users.filter(u => u && u.role !== 'admin');

  const revenue = orders.filter(o => o.paymentStatus === 'paid' && o.status !== 'cancelled').reduce((s, o) => s + o.price, 0);
  const pending = orders.filter(o => o.status === 'pending');
  const inProgress = orders.filter(o => o.status === 'in_progress');
  const completed = orders.filter(o => o.status === 'completed');

  // Greetings
  if (/^(hi|hello|hey)\b/.test(q)) {
    return {
      reply: `Hello Admin! 👋 I'm **Nova Admin**, your AI business analyst. I have live access to your store data. Ask me things like:\n\n• "How is business today?"\n• "Which service sells best?"\n• "Show pending orders"\n• "Give me growth insights"`,
      suggestions: ['Business summary', 'Show pending orders', 'Best selling services', 'Growth insights']
    };
  }

  // Summary / overview
  if (/summary|overview|how is business|report|stats|dashboard|today|performance/.test(q)) {
    return {
      reply: `📊 **Business Summary**\n\n• 💰 Total revenue: **$${revenue.toLocaleString()}**\n• 📦 Total orders: **${orders.length}** (${pending.length} pending, ${inProgress.length} in progress, ${completed.length} completed)\n• 👥 Registered customers: **${users.length}**\n• 🛠️ Active services: **${db.services.length}**\n\n${pending.length > 0 ? `⚠️ You have **${pending.length} pending order(s)** waiting to be processed — I recommend actioning those first.` : '✅ No pending orders — great job staying on top of things!'}`,
      suggestions: ['Show pending orders', 'Best selling services', 'Growth insights']
    };
  }

  // Pending orders
  if (/pending|new order|unprocessed|queue/.test(q)) {
    if (!pending.length) return { reply: '✅ No pending orders right now. Everything is being processed!', suggestions: ['Business summary'] };
    const lines = pending.map(o => `• **${o.id}** — ${o.serviceName} (${o.packageName}) — $${o.price} — by ${o.userName}`).join('\n');
    return { reply: `🕐 **Pending orders (${pending.length}):**\n\n${lines}\n\nYou can update their status from the Orders table in the dashboard.`, suggestions: ['Business summary', 'Growth insights'] };
  }

  // Best sellers
  if (/best|top|selling|popular|most/.test(q)) {
    const counts = {};
    orders.forEach(o => { counts[o.serviceName] = (counts[o.serviceName] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return { reply: 'No order data yet to analyze. Once orders come in, I can rank your best sellers!', suggestions: ['Business summary'] };
    const lines = sorted.map(([name, count], i) => `${['🥇', '🥈', '🥉'][i] || '•'} **${name}** — ${count} order(s)`).join('\n');
    return { reply: `🏆 **Best selling services:**\n\n${lines}\n\n💡 Consider promoting your top performers on the homepage hero section.`, suggestions: ['Business summary', 'Growth insights'] };
  }

  // Customers
  if (/customer|user|client|who/.test(q)) {
    const lines = users.slice(0, 8).map(u => `• **${u.name}** (${u.email}) — ${u.country || 'N/A'}`).join('\n');
    return { reply: `👥 **Registered customers (${users.length}):**\n\n${lines || 'No customers yet.'}`, suggestions: ['Business summary'] };
  }

  // Revenue
  if (/revenue|money|income|earn|profit|sales/.test(q)) {
    const byService = {};
    orders.filter(o => o.paymentStatus === 'paid' && o.status !== 'cancelled').forEach(o => { byService[o.serviceName] = (byService[o.serviceName] || 0) + o.price; });
    const lines = Object.entries(byService).sort((a, b) => b[1] - a[1]).map(([n, v]) => `• **${n}**: $${v.toLocaleString()}`).join('\n');
    return { reply: `💰 **Revenue breakdown:**\n\nTotal: **$${revenue.toLocaleString()}**\n\n${lines || 'No revenue yet.'}\n\n💡 Average order value: **$${orders.length ? Math.round(revenue / orders.length) : 0}**`, suggestions: ['Best selling services', 'Growth insights'] };
  }

  // Growth insights
  if (/insight|growth|grow|improve|recommend|suggest|advice|strategy/.test(q)) {
    const completionRate = orders.length ? Math.round((completed.length / orders.length) * 100) : 0;
    return {
      reply: `🚀 **AI Growth Insights for CreatiHub:**\n\n1. **Order completion rate is ${completionRate}%** — ${completionRate < 70 ? 'focus on faster turnaround to boost reviews.' : 'excellent! Showcase this in marketing.'}\n2. **Bundle opportunity:** Customers who order flyers often need social media kits — create a "Launch Pack" bundle at 15% off.\n3. **Global reach:** Enable local payment methods (M-Pesa, UPI, Pix) to convert more visitors from Africa & Asia.\n4. **Upsell:** After video orders, automatically suggest voiceover add-ons at checkout.\n5. **Retention:** ${users.length} registered customers — send a re-engagement coupon to those inactive 30+ days.\n\nWant me to drill into any of these?`,
      suggestions: ['Business summary', 'Best selling services', 'Show pending orders']
    };
  }

  // Help
  if (/help|what can you/.test(q)) {
    return { reply: `I can analyze your live store data. Try asking:\n\n• "Business summary" — revenue, orders, customers\n• "Show pending orders" — orders needing action\n• "Best selling services" — ranked by orders\n• "Revenue breakdown" — earnings per service\n• "Growth insights" — AI recommendations`, suggestions: ['Business summary', 'Growth insights'] };
  }

  return {
    reply: `I can help you run your business with live data. Try:\n\n• 📊 "Business summary"\n• 🕐 "Show pending orders"\n• 🏆 "Best selling services"\n• 💰 "Revenue breakdown"\n• 🚀 "Growth insights"`,
    suggestions: ['Business summary', 'Show pending orders', 'Growth insights']
  };
}

// ============================================================
// AI SAFETY FILTER
// Runs BEFORE userAssistant(). Returns { blocked, reason } when a message
// trips a guardrail, otherwise { blocked: false }. All blocked attempts are
// written to the AI audit trail so the admin can review them.
// ============================================================
function filterMessage(rawMessage, user) {
  const d = getDb();
  const s = d.aiSettings || {};
  const g = s.guardrails || {};
  const msg = String(rawMessage || '');
  const who = user ? `${user.name} (${user.email})` : 'A guest visitor';
  const uidStr = user ? user.id : 'guest';

  // Master kill switch
  if (s.enabled === false) {
    aiAuditLog(uidStr, msg, 'AI disabled by admin');
    return { blocked: true, reason: 'Nova is currently offline. Our team will be with you soon — please email support@creatihub.com.' };
  }

  // Length cap
  const maxLen = g.maxMessageLength || 1000;
  if (msg.length > maxLen) {
    aiAuditLog(uidStr, msg.slice(0, 300), 'Message too long');
    return { blocked: true, reason: `Your message is a bit long (max ${maxLen} characters). Could you shorten it?` };
  }

  const lower = msg.toLowerCase();

  // Prompt-injection blocklist
  if (g.blockPromptInjection !== false && Array.isArray(s.blockedPhrases)) {
    const hit = s.blockedPhrases.find(p => lower.includes(p.toLowerCase()));
    if (hit) {
      aiAuditLog(uidStr, msg, 'Prompt injection attempt: "' + hit + '"');
      logAiActivity('blocked', who, 'Blocked a prompt-injection attempt',
        `Nova refused a message containing: "${hit}". The attempt was logged to the AI audit trail.`);
      return { blocked: true, reason: 'I can only help with CreatiHub services, orders and support. How can I assist you with your project today?' };
    }
  }

  // Blocked topics
  if (Array.isArray(s.blockedTopics) && s.blockedTopics.length) {
    const topic = s.blockedTopics.find(t => lower.includes(t.toLowerCase()));
    if (topic) {
      aiAuditLog(uidStr, msg, 'Blocked topic: ' + topic);
      logAiActivity('blocked', who, 'Declined an off-topic message',
        `Nova declined to discuss "${topic}" — outside its business scope. Logged to audit trail.`);
      return { blocked: true, reason: `I'm Nova, CreatiHub's creative-services assistant, so I can't help with that topic. I can help you with flyers, videos, logos, websites and more — what would you like to create?` };
    }
  }

  // Personal-data scrub: detect and block messages that look like they contain
  // card numbers, long digit sequences, or raw passwords being shared.
  if (g.blockPersonalData !== false) {
    if (/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/.test(msg) || /\b\d{13,19}\b/.test(msg)) {
      aiAuditLog(uidStr, msg.slice(0, 300), 'Shared card number / PII');
      logAiActivity('blocked', who, 'Blocked a message containing card data',
        'Nova stopped a chat where the user appeared to share a card number. No payment data is accepted over chat.');
      return { blocked: true, reason: 'For your security, please never share card numbers or payment details in chat. All payments are handled securely through Paystack at checkout.' };
    }
  }

  return { blocked: false };
}

// ============================================================
// AI ACTION LOGGER (wraps userAssistant + adminAssistant)
// Logs every AI task to the live admin feed so the admin can see, in real
// time, exactly what Nova is doing for each visitor / customer.
// ============================================================
function classifyUserIntent(message, reply) {
  const q = (message || '').toLowerCase();
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|yo|hola)\b/.test(q)) return { type: 'greeting', action: 'Greeted a visitor' };
  if (/track|order status|my order|where is my/.test(q)) return { type: 'order_help', action: 'Looked up a customer\'s orders' };
  if (/price|cost|how much|cheap|expensive|pricing/.test(q)) return { type: 'faq', action: 'Answered a pricing question' };
  if (/deliver|how long|turnaround|fast|deadline/.test(q)) return { type: 'faq', action: 'Answered a delivery-time question' };
  if (/revision|change|edit|refund|guarantee/.test(q)) return { type: 'faq', action: 'Answered a revisions / refund question' };
  if (/pay|payment|card|paypal|crypto|method/.test(q)) return { type: 'faq', action: 'Answered a payment question' };
  if (/currenc|country|worldwide|international|global|language/.test(q)) return { type: 'faq', action: 'Answered a currency / reach question' };
  if (/thank|thanks|great|awesome|cool/.test(q)) return { type: 'greeting', action: 'Closed a conversation politely' };
  if (/all services|show.*service|what.*(offer|do you)|list|catalog|everything/.test(q)) return { type: 'recommendation', action: 'Listed all services' };
  return { type: 'recommendation', action: 'Recommended a service' };
}

// Safe wrapper around the user assistant that applies the safety filter first
// and logs the AI action afterwards. This is what /api/chat calls.
function safeUserAssistant(message, user) {
  const filter = filterMessage(message, user);
  if (filter.blocked) {
    const who = user ? `${user.name} (${user.email})` : 'A guest visitor';
    logAiActivity('blocked', who, 'Refused a message (safety filter)', filter.reason);
    return {
      reply: filter.reason,
      suggestions: ['Show me all services', 'I need a flyer', 'Track my order'],
      blocked: true,
      blockReason: filter.reason
    };
  }
  const result = userAssistant(message, user);
  const who = user ? `${user.name} (${user.email})` : 'A guest visitor';
  const intent = classifyUserIntent(message, result.reply);
  const detail = result.serviceId
    ? `${who} asked: "${String(message).slice(0, 100)}" → Nova ${intent.action.toLowerCase()} and suggested ordering "${result.serviceId}".`
    : `${who} asked: "${String(message).slice(0, 100)}" → Nova ${intent.action.toLowerCase()}.`;
  logAiActivity(intent.type, who, intent.action, detail);
  return result;
}

// Safe wrapper for the admin assistant — logs analytics tasks too.
function safeAdminAssistant(message, adminName) {
  const d = getDb();
  const s = d.aiSettings || {};
  if (s.adminAssistantEnabled === false) {
    return { reply: 'The Nova admin assistant is currently disabled by an administrator. Re-enable it from the AI Safety tab.', suggestions: [] };
  }
  const result = adminAssistant(message);
  const who = adminName || 'Admin';
  const q = (message || '').toLowerCase();
  let action = 'Ran a business analysis';
  if (/summary|overview|how is business|report|stats|today|performance/.test(q)) action = 'Generated a business summary';
  else if (/pending|new order|unprocessed|queue/.test(q)) action = 'Listed pending orders';
  else if (/best|top|selling|popular|most/.test(q)) action = 'Ranked best-selling services';
  else if (/revenue|money|income|earn|profit|sales/.test(q)) action = 'Broke down revenue by service';
  else if (/insight|growth|grow|improve|recommend|suggest|advice|strategy/.test(q)) action = 'Generated AI growth insights';
  else if (/customer|user|client|who/.test(q)) action = 'Listed registered customers';
  else if (/^(hi|hello|hey)\b/.test(q)) action = 'Greeted the admin';
  logAiActivity('analytics', who, action, `${who} asked Nova Admin: "${String(message).slice(0, 100)}"`);
  return result;
}

// ============================================================
// CO-FOUNDER AI — Marketing & Advertising Strategy Generator
// Acts as a creative co-founder that generates advertising campaigns,
// cartoon video ideas, animated ad concepts, social media strategies,
// and growth tactics to pull more crowds to CreatiHub.
// ============================================================
function coFounderAssistant(message) {
  const db = getDb();
  const q = (message || '').toLowerCase().trim();
  const services = db.services || [];
  const orders = db.orders || [];
  const users = db.users || [];
  const topService = services[0] ? services[0].name : 'flyer design';

  // Greetings
  if (/^(hi|hello|hey)\b/.test(q)) {
    return {
      reply: `Hey there! 👋 I'm your **AI Co-Founder** — think of me as your creative business partner. I live and breathe marketing. I can help you:\n\n• 🎬 Generate **cartoon video ad** concepts that go viral\n• 📱 Plan **animated social media ad** campaigns\n• 🧠 Brainstorm **marketing strategies** to pull massive crowds\n• ✍️ Write **ad copy, slogans & hooks** that convert\n• 📅 Build a **content calendar** for organic growth\n• 💰 Allocate your **ad budget** across platforms\n• 🎯 Target the **right audience** on TikTok, Instagram, YouTube\n\n**🎯 NEW: I can also GENERATE real creative assets for you!**\nI can create actual cartoon images, flyer designs, video ad scripts, logos, voiceovers, and social media graphics — ready to download and use in your ads!\n\nWhat's our next big move? Ask me anything — like *"Create a cartoon video ad for flyers"* or *"How do I get 10,000 visitors this month?"*`,
      suggestions: ['Create a cartoon video ad', 'Plan a social media campaign', 'How to get 10,000 visitors', 'Write ad copy that converts'],
      actions: [
        { label: '🎨 Generate Cartoon Image', type: 'cartoon' },
        { label: '📄 Generate Flyer', type: 'flyer' },
        { label: '🎬 Generate Video Ad', type: 'video' }
      ]
    };
  }

  // Cartoon video ad ideas
  if (/cartoon.*video|video.*cartoon|animated.*cartoon|cartoon.*ad/.test(q)) {
    return {
      reply: `🎬 **Cartoon Video Ad Campaign — "The Creative Spark"**\n\nHere's a viral cartoon video ad concept for CreatiHub:\n\n**CONCEPT: "From Blank to Brilliant"**\n\n*Scene 1 (0-3s):* A stressed entrepreneur stares at a blank screen. Sweat drops. Clock ticking. 😰\n\n*Scene 2 (3-8s):* A sparkly cartoon character (Nova mascot) zooms in like a superhero. "Need creative help? I got you!" ✨\n\n*Scene 3 (8-15s):* Quick montage — Nova waves her wand and: WHOOSH! A beautiful flyer appears. WHOOSH! A pro logo. WHOOSH! A stunning video. Each transformation is playful and colorful. 🎨\n\n*Scene 4 (15-20s):* The entrepreneur is now dancing with joy, holding a phone showing their brand going viral. "CreatiHub made it happen!" 🕺\n\n*Scene 5 (20-25s):* Logo + tagline: **"CreatiHub — From Blank to Brilliant in 24 Hours"** + "Visit creatihub.com.ng" 🚀\n\n**STYLE:** Bright, playful 2D cartoon animation. Think Cartoon Network meets startup ad. Upbeat music. 25 seconds.\n\n**WHERE TO POST:**\n• TikTok (vertical 9:16) — add trending sound\n• Instagram Reels — add text overlays\n• YouTube Shorts — add CTA card\n• Facebook Ads — run as 15s + 25s versions\n\n**BUDGET TIP:** Produce one master animation, then cut it into 3 sizes. Total production cost: $50-150 on CreatiHub itself! 😄\n\n---\n\n⬇️ **I can generate real assets for this ad right now!** Use the buttons below:`,
      suggestions: ['Create another cartoon ad', 'Plan the ad budget', 'Write the voiceover script', 'Which platforms to target?'],
      actions: [
        { label: '🎬 Generate Video Ad', type: 'video' },
        { label: '🎨 Generate Cartoon Image', type: 'cartoon' },
        { label: '🔊 Generate Voiceover', type: 'voiceover' }
      ]
    };
  }

  // Animated ad / motion graphics
  if (/animated.*ad|motion.*graphic|animation.*ad|gif.*ad/.test(q)) {
    return {
      reply: `✨ **Animated Ad Campaign — "Speed & Quality"**\n\n**CONCEPT: 15-Second Motion Graphics Ads**\n\n*Ad 1 — "The 24-Hour Promise":*\nAnimated clock spins. Text pops: "Need a flyer by tomorrow?" → WHOOSH → Beautiful flyer appears → "Done in 24 hours. CreatiHub." ⏱️🎨\n\n*Ad 2 — "Global Creative Hub":*\nWorld map spins. Pins drop in Lagos, London, New York, Mumbai. Each pin shows a different service being created. "CreatiHub — Creative services for every corner of the world." 🌍\n\n*Ad 3 — "Price Drop Reveal":*\nPrices animate counting down: $75 → $35 → $15. "Premium creative services. Prices that make sense." → Show 3 packages. 💰\n\n*Ad 4 — "Before & After":*\nSplit screen. Left: dull DIY attempt. Right: CreatiHub professional result. "Why DIY when you can go pro?" Slide the divider back and forth. 🔥\n\n**PRODUCTION:** Use CreatiHub's own automated video service ($29-149) to create these. One package = multiple ad variations!\n\n**POSTING STRATEGY:**\n• Run Ad 1 & 2 as Facebook/Instagram feed ads ($5-10/day each)\n• Run Ad 3 & 4 as Stories/Snaps (higher engagement)\n• A/B test which performs best, then scale the winner\n\n---\n\n⬇️ **I can generate real assets for these ads right now!** Use the buttons below:`,
      suggestions: ['Write full ad scripts', 'Plan the media buy budget', 'Create a TikTok ad concept', 'Design the ad targeting'],
      actions: [
        { label: '🎬 Generate Video Ad', type: 'video' },
        { label: '📄 Generate Flyer', type: 'flyer' },
        { label: '📱 Generate Social Media Kit', type: 'social' }
      ]
    };
  }

  // Social media campaign
  if (/social.*media|campaign|instagram|tiktok|facebook.*ad|content.*calendar/.test(q)) {
    return {
      reply: `📱 **30-Day Social Media Campaign — "Creative Challenge"**\n\n**THE BIG IDEA:** Run a "30-Day Creative Challenge" — every day, post a different CreatiHub service with a before/after or speed-design video.\n\n**WEEK 1 — "Design Week":**\n• Day 1: Speed-design a flyer (timelapse) 🎨\n• Day 2: Logo evolution (concept → final) ✨\n• Day 3: Social media kit showcase 📱\n• Day 4: Cartoon avatar transformation 😄\n• Day 5: Book cover reveal 👀\n• Day 6: T-shirt/merch design drop 👕\n• Day 7: "Pick your favorite" poll (boost engagement) 📊\n\n**WEEK 2 — "Video & Audio Week":**\n• Day 8: Automated video ad demo 🎬\n• Day 9: AI voiceover in 5 languages 🌍\n• Day 10: Music jingle sample 🎵\n• Day 11: YouTube thumbnail A/B test 📺\n• Day 12-14: Behind-the-scenes "how we make your video"\n\n**WEEK 3 — "Business Week":**\n• Day 15: Pitch deck teardown 📊\n• Day 16: SEO copywriting tips ✍️\n• Day 17: Email campaign template reveal 📧\n• Day 18: AI chatbot demo 🤖\n• Day 19-21: Customer testimonials + results\n\n**WEEK 4 — "Mega Promo Week":**\n• Day 22-27: Countdown to a flash sale (20% off)\n• Day 28: Flash sale launch 🔥\n• Day 29: "Last chance" urgency posts\n• Day 30: Winner announcement + next challenge teaser\n\n**PLATFORM STRATEGY:**\n• **TikTok:** Vertical speed-design videos (highest reach for creative content)\n• **Instagram:** Reels + carousel posts + Stories with polls\n• **YouTube Shorts:** 30-60s tutorials + before/afters\n• **Facebook:** Video ads targeting small business owners\n• **LinkedIn:** B2B posts about pitch decks & branding\n\n**HASHTAGS:** #CreativeChallenge #CreatiHub #DesignIn24Hours #FromBlankToBrilliant #CreativeServices\n\n**EXPECTED REACH:** With consistent posting + $50/week in boosted posts, aim for 50K-100K impressions in 30 days.\n\n---\n\n⬇️ **I can generate real assets for this campaign right now!** Use the buttons below:`,
      suggestions: ['Write TikTok post captions', 'Plan the ad budget for this', 'Create the flash sale strategy', 'Which audience to target?'],
      actions: [
        { label: '📱 Generate Social Media Kit', type: 'social' },
        { label: '📄 Generate Flyer', type: 'flyer' },
        { label: '🎬 Generate Video Ad', type: 'video' }
      ]
    };
  }

  // How to get more visitors / traffic / crowds
  if (/visitor|traffic|crowd|more.*customer|get.*user|10.?000|grow.*audience|pull.*crowd/.test(q)) {
    return {
      reply: `🚀 **"10,000 Visitors in 30 Days" — Growth Playbook**\n\nHere's a multi-channel strategy to pull massive crowds:\n\n**1. VIRAL CONTENT ENGINE (Free Traffic)**\n• Post 1-2 TikTok/Reels DAILY — speed-design videos get 10x more views\n• Format: "Watch me design this in 60 seconds" → show process → reveal result\n• Hook viewers in first 2 seconds: "You won't believe this transformation..."\n• Target: 3-5 viral videos (100K+ views each) in the month\n\n**2. PAID AD BLITZ ($200-500 budget)**\n• Facebook/Instagram ads: $10/day → target small business owners age 25-45\n• TikTok Spark Ads: $10/day → boost your best organic videos\n• Google Search ads: $5/day → bid on "cheap flyer design" "logo design online"\n• Retargeting: $5/day → show ads to website visitors who didn't buy\n\n**3. INFLUENCER MICRO-PARTNERSHIPS (Free/Low Cost)**\n• Find 10-15 micro-influencers (5K-50K followers) in business/entrepreneurship niche\n• Offer them a free CreatiHub service in exchange for a shoutout\n• Target: 5 accept → each brings 200-500 visitors\n\n**4. COMMUNITY MARKETING (Free)**\n• Post in 20+ Facebook groups (small business, entrepreneurs, startups)\n• Share value first: "Free guide: 5 design tips for your business" → then soft pitch\n• Answer questions on Quora/Reddit with CreatiHub links\n• Join 5 WhatsApp/Telegram business groups\n\n**5. EMAIL MARKETING (Free)**\n• You have ${users.length} registered users — send them a "We miss you" 20% off coupon\n• Create a weekly newsletter with design tips + special offers\n• Automated welcome series for new signups\n\n**6. SEO CONTENT (Long-term Free Traffic)**\n• Write 4 blog posts: "How to design a flyer that converts", "Logo design mistakes to avoid", "Best video formats for social media", "How to choose brand colors"\n• Each post targets a search keyword → brings organic traffic forever\n\n**PROJECTED BREAKDOWN:**\n• Viral content: 3,000-5,000 visitors\n• Paid ads: 2,000-3,000 visitors\n• Influencers: 1,000-2,500 visitors\n• Community: 1,000-2,000 visitors\n• Email: 500-1,000 visitors\n• SEO: 200-500 visitors (grows over time)\n• **TOTAL: 7,700-14,000 visitors** 🎯\n\n**QUICK WINS (Do This Week):**\n1. ✅ Post 3 TikTok speed-design videos today\n2. ✅ Launch a $50 Facebook ad campaign\n3. ✅ Email all ${users.length} users with a special offer\n4. ✅ Join 5 entrepreneur Facebook groups\n\nWant me to create the TikTok video scripts or write the email campaign?`,
      suggestions: ['Create TikTok video scripts', 'Write the email campaign', 'Plan the $200 ad budget', 'Write the blog post topics']
    };
  }

  // Ad copy / slogans / hooks
  if (/ad.*copy|slogan|hook|tagline|headline|copy.*write|write.*ad/.test(q)) {
    return {
      reply: `✍️ **Ad Copy & Slogans That Convert**\n\n**TOP SLOGANS FOR CREATIHUB:**\n1. "From Blank to Brilliant in 24 Hours" ⚡\n2. "Your Brand, Beautifully Done" 🎨\n3. "Creative Services for Every Budget" 💰\n4. "Don't Just Launch — Stand Out" 🚀\n5. "Professional Design. Prices You'll Love." ❤️\n6. "We Create. You Celebrate." 🎉\n7. "The World's Creative Hub" 🌍\n\n**HIGH-CONVERTING AD HOOKS (first 3 seconds):**\n• "Stop paying $500 for a logo..." 💸\n• "Watch this flyer design itself in 60 seconds..." ⏱️\n• "Your competitor's brand looks better than yours. Here's why..." 😏\n• "I dare you to find a cheaper professional design service..." 🔥\n• "This is what $15 gets you on CreatiHub..." (show result) 😲\n• "POV: You just launched your business and need everything designed..." 🎬\n\n**FACEBOOK AD COPY (Long Form):**\n"Starting a business but can't afford a designer? 🤔\n\nYou're not alone. Most entrepreneurs spend $500+ on branding — or worse, DIY it and look amateur.\n\nAt CreatiHub, professional design starts at just $15. Flyers, logos, videos, websites — all done by creative pros, delivered in 24-48 hours.\n\n✅ 19+ services to choose from\n✅ Prices in your local currency\n✅ Unlimited revisions on premium packages\n✅ Satisfaction guaranteed\n\nStop settling for mediocre. Your brand deserves better.\n\n👉 Visit creatihub.com.ng today and use code SPARK20 for 20% off your first order!"\n\n**TIKTOK CAPTION (Short & Punchy):**\n"$15 flyer vs $500 flyer — can you tell the difference? 🤯 CreatiHub.com.ng #Design #SmallBusiness #Branding"\n\n**INSTAGRAM STORY COPY:**\n"Need a logo? Flyer? Video? 🎨 We do it ALL — starting at $15. Link in bio! 🔥"\n\n---\n\n⬇️ **I can generate real marketing assets to match this copy right now!** Use the buttons below:`,
      suggestions: ['Write TikTok video scripts', 'Create the full Facebook ad', 'Write email subject lines', 'Design the ad targeting'],
      actions: [
        { label: '📄 Generate Flyer', type: 'flyer' },
        { label: '⚡ Generate Logo', type: 'logo' },
        { label: '📱 Generate Social Media Kit', type: 'social' }
      ]
    };
  }

  // Budget allocation
  if (/budget|spend|how much.*ad|ad.*cost|money.*marketing|allocate/.test(q)) {
    return {
      reply: `💰 **Marketing Budget Allocation Guide**\n\n**TIER 1 — Bootstrapped ($50-100/month):**\n• TikTok/Reels organic content: $0 (your time only)\n• Boost 2 best posts: $20\n• Facebook ads: $30 (test 2 audiences, $5/day for 6 days)\n• Email marketing: $0 (free with your existing users)\n• Community marketing: $0 (Facebook groups, Quora)\n• **ROI target: 5-10 new customers**\n\n**TIER 2 — Growth ($200-500/month):**\n• Facebook/Instagram ads: $150 (3 campaigns, $5/day each)\n• TikTok Spark Ads: $50 (boost viral content)\n• Google Search ads: $50 (intent-based keywords)\n• Retargeting pixel: $30 (recover lost visitors)\n• Influencer partnerships: $100 (2-3 micro-influencers)\n• Content creation (on CreatiHub): $50 (video ad production)\n• **ROI target: 20-50 new customers**\n\n**TIER 3 — Scale ($1,000+/month):**\n• Full-funnel paid ads: $500 (awareness → consideration → conversion)\n• Influencer campaigns: $200 (5-10 creators)\n• Content production: $150 (weekly video ads, graphics)\n• SEO + blog content: $100 (2-4 articles/month)\n• Email automation tools: $50\n• **ROI target: 100-200 new customers**\n\n**GOLDEN RULES:**\n1. Start with Tier 1, prove it works, then scale to Tier 2\n2. Always track which channel brings the most customers\n3. 70% of budget on what's working, 30% on testing new things\n4. Never spend more than you can afford to lose in month 1\n5. Reinvest profits: every $1 in ads should bring $3+ in revenue\n\n**WITH YOUR CURRENT DATA:**\n• You have ${users.length} registered users and ${orders.length} orders\n• Focus on retargeting existing visitors first (cheapest conversion)\n• Then expand to lookalike audiences\n\nWant me to create a specific ad campaign for your budget tier?`,
      suggestions: ['Create a $100 ad campaign', 'Plan the retargeting strategy', 'Which keywords to bid on?', 'Write the email to existing users']
    };
  }

  // Platform targeting / audience
  if (/target|audience|who.*customer|ideal.*customer|platform|where.*post|which.*platform/.test(q)) {
    return {
      reply: `🎯 **Audience Targeting Strategy**\n\n**YOUR IDEAL CUSTOMERS (3 Personas):**\n\n**Persona 1: "The New Entrepreneur" 👩‍💼**\n• Age: 22-35\n• Just started a business, needs branding\n• Budget-conscious ($15-50 per service)\n• Where they hang out: TikTok, Instagram, Facebook groups\n• Pain point: "I need to look professional but can't afford an agency"\n• Best services to promote: Logo design, flyer design, social media kit\n\n**Persona 2: "The Small Business Owner" 🏪**\n• Age: 30-50\n• Established business, needs marketing materials\n• Budget: $30-150 per service\n• Where they hang out: Facebook, LinkedIn, WhatsApp groups\n• Pain point: "I need ads and content but my designer is slow/expensive"\n• Best services: Automated video, email campaign, product photography\n\n**Persona 3: "The Content Creator" 🎥**\n• Age: 18-30\n• Needs thumbnails, voiceovers, video editing\n• Budget: $10-50 per service\n• Where they hang out: TikTok, YouTube, Instagram\n• Pain point: "I need consistent content but can't do it all myself"\n• Best services: YouTube thumbnails, voiceover, automated video\n\n**PLATFORM-BY-PLATFORM TARGETING:**\n\n**TIKTOK ADS:**\n• Target: Age 18-35, interests: entrepreneurship, small business, design\n• Format: Vertical video, 15-30s, trending sounds\n• Best for: Brand awareness, viral reach\n• Cost: $5-20 CPM (cheapest reach)\n\n**FACEBOOK/INSTAGRAM ADS:**\n• Target: Age 25-45, interests: business owner, marketing, startup\n• Format: Carousel ads (show multiple services), video ads\n• Best for: Conversions (people ready to buy)\n• Cost: $10-30 CPM\n\n**GOOGLE SEARCH ADS:**\n• Keywords: "cheap flyer design" "logo design online" "professional video ads" "creative services marketplace"\n• Best for: High-intent buyers (they're already searching)\n• Cost: $1-5 per click\n\n**YOUTUBE ADS:**\n• Target: People watching business/design/entrepreneurship content\n• Format: 15s bumper ads, 30s skippable\n• Best for: Brand awareness + retargeting\n\n**LINKEDIN ADS:**\n• Target: Business professionals, startups\n• Best for: B2B services (pitch decks, branding)\n• Cost: Higher but high-value customers\n\n**MY RECOMMENDATION:**\nStart with **TikTok (awareness) + Facebook (conversion) + Google (intent)**. That covers the full funnel.\n\nWant me to set up the specific ad targeting for any platform?`,
      suggestions: ['Set up Facebook ad targeting', 'Create TikTok ad content', 'Find the best Google keywords', 'Write LinkedIn B2B ad copy']
    };
  }

  // Email marketing campaign
  if (/email.*campaign|email.*market|newsletter|email.*user|re.?engage/.test(q)) {
    return {
      reply: `📧 **Email Marketing Campaign Strategy**\n\n**CAMPAIGN 1: "We Miss You" Re-Engagement**\n*Send to: All ${users.length} registered users who haven't ordered recently*\n\n*Subject:* "We miss you, [Name]! Here's 20% off 🎁"\n*Body:* "Hey [Name], we noticed you haven't visited CreatiHub in a while. We've added new services, faster delivery, and better prices. To welcome you back, here's an exclusive 20% discount: code WELCOMEBACK20. Expires in 48 hours! Visit creatihub.com.ng now." \n\n**CAMPAIGN 2: "New Service Launch"**\n*Send to: All users*\n*Subject:* "🆕 We just launched [Service Name]!"\n*Body:* Showcase the new service with a before/after image, pricing, and a limited-time intro offer.\n\n**CAMPAIGN 3: Weekly "Creative Tips" Newsletter**\n*Subject:* "🎨 This week's creative tip + special offer"\n*Body:* Share one valuable design/marketing tip, then soft-sell a relevant CreatiHub service. Value first, pitch second.\n\n**CAMPAIGN 4: "Flash Sale" (Monthly)**\n*Subject:* "⚡ 48-HOUR FLASH SALE: 30% off everything!"\n*Body:* Urgency-driven. Countdown timer. Show top services. Clear CTA.\n\n**EMAIL AUTOMATION SERIES (Welcome Flow):**\n*Email 1 (immediately):* "Welcome to CreatiHub! 🎉 Here's what you can do..." + 10% off first order\n*Email 2 (Day 2):* "Need a logo? See what $25 gets you..." + showcase\n*Email 3 (Day 5):* "How [customer name] grew their brand with CreatiHub" + testimonial\n*Email 4 (Day 7):* "Your 10% off expires tomorrow! ⏰" + urgency\n\n**BEST PRACTICES:**\n• Send Tuesday-Thursday, 10am-2pm (highest open rates)\n• Keep subject lines under 50 characters\n• Always include one clear CTA button\n• Use the recipient's first name\n• Mobile-first design (70% read on phones)\n\n**WITH YOUR ADMIN DASHBOARD:** You already have the email broadcast feature! Go to Admin → Email → Generate Template → Broadcast to all users.\n\nWant me to write the full email copy for any of these campaigns?`,
      suggestions: ['Write the "We Miss You" email', 'Write the welcome series', 'Create the flash sale email', 'Generate email via admin broadcast']
    };
  }

  // Influencer marketing
  if (/influencer|partner|collab|shoutout|ambassador/.test(q)) {
    return {
      reply: `🤝 **Influencer & Partnership Strategy**\n\n**MICRO-INFLUENCER CAMPAIGN (Best ROI for CreatiHub):**\n\n**WHY MICRO-INFLUENCERS?**\n• They have 5K-50K highly engaged followers\n• Much cheaper than big influencers ($0-200 per post vs $5K+)\n• Their audience trusts them → higher conversion\n• Perfect for CreatiHub's budget-friendly services\n\n**HOW TO FIND THEM:**\n1. Search TikTok/Instagram for: #smallbusiness, #entrepreneur, #sidehustle, #branding, #logodesign\n2. Look for creators who post about starting businesses\n3. Check their engagement rate (likes+comments / followers) — aim for 3%+\n4. DM them: "Hey! Love your content. We're CreatiHub — a creative services marketplace. We'd love to hook you up with a free logo/flyer in exchange for a shoutout. Interested?"\n\n**OUTREACH TEMPLATE:**\n"Hi [Name]! 👋 I'm [your name] from CreatiHub. We help entrepreneurs get professional design work (logos, flyers, videos) starting at just $15. We love your content and think your audience would love us too!\n\nWe'd like to offer you a FREE [service of choice] in exchange for an honest shoutout to your followers. No pressure, no script — just share your experience!\n\nLet me know if you're interested and I'll set it up. 🎨✨"\n\n**TARGET NUMBERS:**\n• Reach out to 20 influencers\n• Expect 5-8 to respond\n• Expect 3-5 to accept\n• Each brings 200-1,000 visitors\n• **Projected: 1,000-3,000 new visitors**\n\n**CREATIVE COLLABORATION IDEAS:**\n• "Design Challenge" — influencer challenges us to design something in 24h\n• "Before & After" — show the transformation CreatiHub did for their brand\n• "Rate My Design" — influencer rates CreatiHub designs vs expensive agencies\n• "Day in the Life" — show how CreatiHub helps their business\n\n**AFFILIATE PROGRAM (Long-term):**\n• Offer influencers 15-20% commission on every order they refer\n• Give them a unique promo code (e.g., "JANE15" for 15% off)\n• Track via promo code usage\n• This turns influencers into permanent salespeople!\n\nWant me to write more outreach templates or design the affiliate program?`,
      suggestions: ['Write more outreach templates', 'Design the affiliate program', 'Create a referral discount system', 'Plan the influencer budget']
    };
  }

  // General marketing / advertising / promote
  if (/market|advertis|promote|campaign|grow|strategy|idea|plan/.test(q)) {
    return {
      reply: `🧠 **Marketing Strategy Menu — Pick Your Weapon**\n\nHere's everything I can help you create to pull more crowds:\n\n**🎬 VIDEO ADS:**\n• Cartoon video ad concepts (viral-worthy)\n• Animated motion graphics ads\n• TikTok/Reels speed-design videos\n• YouTube bumper ads\n\n**📱 SOCIAL MEDIA:**\n• 30-day content calendar\n• Platform-specific post strategies\n• Viral hashtag strategies\n• Engagement-boosting tactics\n\n**✍️ COPYWRITING:**\n• Ad slogans & taglines\n• High-converting ad hooks\n• Facebook/Google ad copy\n• Email subject lines\n\n**💰 BUDGETING:**\n• Bootstrapped plan ($50-100/mo)\n• Growth plan ($200-500/mo)\n• Scale plan ($1,000+/mo)\n• ROI tracking framework\n\n**🎯 TARGETING:**\n• Customer personas\n• Platform-by-platform audience targeting\n• Keyword research for Google ads\n• Retargeting strategies\n\n**📧 EMAIL MARKETING:**\n• Re-engagement campaigns\n• Welcome automation series\n• Flash sale emails\n• Weekly newsletters\n\n**🤝 PARTNERSHIPS:**\n• Micro-influencer outreach\n• Affiliate program design\n• Referral discount system\n• Brand collaboration ideas\n\n**Just tell me what you want to work on!** For example:\n• "Create a cartoon video ad for logo design"\n• "Write a 7-day TikTok content plan"\n• "How do I get 1,000 visitors this week?"\n• "Write a Facebook ad for flyer design"\n\n---\n\n⬇️ **Or let me generate real creative assets right now!**`,
      suggestions: ['Create a cartoon video ad', 'Plan a 30-day content calendar', 'How to get 10,000 visitors', 'Write ad copy that converts', 'Plan the marketing budget'],
      actions: [
        { label: '🎨 Generate Cartoon Image', type: 'cartoon' },
        { label: '📄 Generate Flyer', type: 'flyer' },
        { label: '🎬 Generate Video Ad', type: 'video' },
        { label: '⚡ Generate Logo', type: 'logo' }
      ]
    };
  }

  // Help
  if (/help|what can you/.test(q)) {
    return {
      reply: `I'm your **AI Co-Founder** — your creative marketing partner! 🧠✨ I can help you:\n\n• 🎬 Create cartoon video ad concepts\n• 📱 Plan social media campaigns\n• ✍️ Write ad copy, slogans & hooks\n• 💰 Plan marketing budgets\n• 🎯 Define audience targeting\n• 📧 Design email campaigns\n• 🤝 Plan influencer partnerships\n• 🚀 Build growth strategies to pull crowds\n\nWhat would you like to work on?`,
      suggestions: ['Create a cartoon video ad', 'How to get 10,000 visitors', 'Write ad copy that converts', 'Plan the marketing budget']
    };
  }

  // Fallback — try to be helpful with marketing context
  return {
    reply: `I'm your AI Co-Founder, focused on marketing & growth! 🚀 I didn't quite catch that, but here's what I can do:\n\n• 🎬 Generate **cartoon video ad** concepts\n• 📱 Plan **social media campaigns**\n• ✍️ Write **ad copy & slogans**\n• 💰 Plan **marketing budgets**\n• 🎯 Define **audience targeting**\n• 📧 Design **email campaigns**\n• 🤝 Plan **influencer partnerships**\n• 🚀 Build **growth strategies** to pull crowds\n\nTry asking: *"Create a cartoon video ad for flyers"* or *"How do I get 10,000 visitors this month?"*`,
    suggestions: ['Create a cartoon video ad', 'How to get 10,000 visitors', 'Write ad copy that converts', 'Plan a social media campaign']
  };
}

// Safe wrapper for the co-founder assistant
function safeCoFounderAssistant(message, adminName) {
  const d = getDb();
  const s = d.aiSettings || {};
  if (s.adminAssistantEnabled === false) {
    return { reply: 'The AI Co-Founder is currently disabled. Re-enable it from the AI Safety tab.', suggestions: [] };
  }
  try {
    const result = coFounderAssistant(message);
    const who = adminName || 'Admin';
    logAiActivity('analytics', who, 'Consulted AI Co-Founder for marketing strategy', `${who} asked the Co-Founder AI: "${String(message).slice(0, 100)}"`);
    return result;
  } catch (err) {
    console.error('Co-Founder AI error:', err.message);
    return {
      reply: "I'm your AI Co-Founder! I can help with marketing strategies, cartoon video ads, social media campaigns, ad copy, budget planning, and growth tactics. What would you like to work on?",
      suggestions: ['Create a cartoon video ad', 'How to get 10,000 visitors', 'Write ad copy that converts', 'Plan a social media campaign']
    };
  }
}

module.exports = { userAssistant, adminAssistant, convertPrice, CURRENCY_RATES, CURRENCY_SYMBOLS, filterMessage, safeUserAssistant, safeAdminAssistant, coFounderAssistant, safeCoFounderAssistant };
