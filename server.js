// ============================================================
// CreatiHub Server - Global Creative Services Marketplace
// ============================================================
const express = require('express');
const path = require('path');
const fs = require('fs');

// --- Database backend selection -------------------------------------
// If DATABASE_URL is set, use the PostgreSQL adapter (db-pg.js) for
// bulletproof persistence. Otherwise use the JSON-file backend (db.js).
// Both export the same function surface so the rest of the server is
// identical regardless of backend.
let USE_POSTGRES = !!process.env.DATABASE_URL;
let dbBackend = USE_POSTGRES ? require('./db-pg') : require('./db');
// These are imported at module load; if we fall back to JSON-file at runtime,
// we re-assign them from db.js inside start(). See the fallback catch block.
let { getDb, save, uid, hashPassword, makeToken, generateReferralCode, logActivity, notify, sendEmail, createResetCode, verifyResetCode, consumeResetCode, revokeUserTokens, logAiActivity, aiAuditLog, logPriceChange, markNotificationRead, markAllNotificationsRead } = dbBackend;
if (USE_POSTGRES) console.log('🐘 Using PostgreSQL backend (DATABASE_URL detected)');
else console.log('📄 Using JSON-file backend (set DATABASE_URL to enable PostgreSQL)');

const { userAssistant, adminAssistant, safeUserAssistant, safeAdminAssistant, convertPrice, CURRENCY_RATES, safeCoFounderAssistant, filterMessage } = require('./ai');
const paystack = require('./paystack');
const cryptoPay = require('./cryptoPay');
const { generateLesson, tutorChat, generateEmail, EMAIL_TYPES, aiProviderLabel } = require('./training-ai');
const backup = require('./backup');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------- Paystack webhook (needs RAW body for signature check) ----------------
// Must be registered BEFORE express.json() so we can verify the HMAC signature.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  setBaseUrl(req);
  const signature = req.headers['x-paystack-signature'];
  if (!paystack.verifyWebhookSignature(req.body, signature)) {
    console.error('[PAYSTACK WEBHOOK] Invalid signature — possible tampering or wrong secret key');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  let event;
  try { event = JSON.parse(req.body.toString('utf8')); } catch (e) {
    console.error('[PAYSTACK WEBHOOK] Bad payload', { error: e.message });
    return res.status(400).json({ error: 'Bad payload' });
  }

  if (event.event === 'charge.success') {
    const ref = event.data && event.data.reference;
    const order = ref && db.orders.find(o => o.paymentReference === ref);
    if (order && order.paymentStatus !== 'paid') {
      await markOrderPaid(order, {
        channel: event.data.channel,
        paidAt: event.data.paid_at,
        amount: event.data.amount,
        currency: event.data.currency,
        source: 'webhook'
      });
    }
    // Recurring subscription charge: Paystack sends charge.success with a
    // subscription code on each billing cycle. Update the subscription record.
    const subCode = event.data && event.data.subscription && event.data.subscription.subscription_code;
    if (subCode) {
      const sub = db.subscriptions.find(s => s.subscriptionCode === subCode);
      if (sub) {
        sub.status = 'active';
        sub.lastChargeAt = event.data.paid_at || new Date().toISOString();
        sub.lastChargeReference = ref;
        // Paystack bills monthly in advance; push the period end forward ~30d
        const next = new Date();
        next.setMonth(next.getMonth() + 1);
        sub.currentPeriodEnd = next.toISOString();
        save();
        logActivity('payment', `Recurring charge for ${sub.planName}`,
          `Subscription ${sub.id} (${sub.planName}) charged successfully — ref ${ref}`);
      }
    }

    // Training installment payment: check if this reference belongs to a training enrollment
    const trainingEnrollment = ref && (db.enrollments || []).find(e =>
      e.payments && e.payments.some(p => p.reference === ref && p.status === 'pending')
    );
    if (trainingEnrollment) {
      const payment = trainingEnrollment.payments.find(p => p.reference === ref);
      if (payment) {
        payment.status = 'paid';
        payment.paidAt = event.data.paid_at || new Date().toISOString();
        trainingEnrollment.paymentsMade = (trainingEnrollment.paymentsMade || 0) + 1;
        const program = (db.trainingPrograms || []).find(p => p.id === trainingEnrollment.programId);
        unlockTrainingModules(trainingEnrollment, program);
        // Compute next due date
        const tier = program && program.tiers ? program.tiers.find(t => t.id === trainingEnrollment.tierId) : null;
        const instPlan = tier && tier.installments ? tier.installments.find(i => i.id === trainingEnrollment.installmentPlanId) : null;
        if (instPlan && trainingEnrollment.paymentsMade < trainingEnrollment.installmentCount) {
          trainingEnrollment.nextPaymentDue = computeNextInstallmentDate(instPlan, program.durationWeeks, trainingEnrollment.paymentsMade);
        }
        trainingEnrollment.timeline.push({ status: 'payment', at: new Date().toISOString(), note: `Installment ${payment.installmentNumber} of ${trainingEnrollment.installmentCount} paid ($${payment.amount})` });
        save();
        logActivity('training', `Training installment paid — ${trainingEnrollment.programTitle}`,
          `${trainingEnrollment.userName} paid installment ${payment.installmentNumber}/${trainingEnrollment.installmentCount} for ${trainingEnrollment.programTitle} — ref ${ref}`);
        // Send confirmation email
        if (trainingEnrollment.paymentStatus === 'paid') {
          sendEmail(trainingEnrollment.userEmail, `Training Complete — ${trainingEnrollment.programTitle}`,
            `Congratulations! You've completed all payments for ${trainingEnrollment.programTitle}. All modules are now unlocked. Your certificate of completion is ready in your training dashboard.`);
        } else {
          sendEmail(trainingEnrollment.userEmail, `Installment ${payment.installmentNumber} Confirmed — ${trainingEnrollment.programTitle}`,
            `Your payment of $${payment.amount} for ${trainingEnrollment.programTitle} has been confirmed. ${trainingEnrollment.paymentsMade} of ${trainingEnrollment.installmentCount} installments paid. New modules unlocked!`);
        }
      }
    }
  }

  // A new subscription was created (first successful authorization charge)
  if (event.event === 'subscription.create') {
    const data = event.data || {};
    const subCode = data.subscription_code;
    const ref = data.reference;
    const sub = ref && db.subscriptions.find(s => s.reference === ref);
    if (sub) {
      sub.subscriptionCode = subCode;
      sub.status = 'active';
      sub.activatedAt = new Date().toISOString();
      const next = new Date(); next.setMonth(next.getMonth() + 1);
      sub.currentPeriodEnd = next.toISOString();
      save();
      logActivity('payment', `Subscription activated: ${sub.planName}`,
        `Subscription ${sub.id} activated on Paystack — code ${subCode}`);
    }
  }

  // Subscription cancelled / disabled
  if (event.event === 'subscription.disable' || event.event === 'subscription.not_active') {
    const data = event.data || {};
    const subCode = data.subscription_code;
    const sub = db.subscriptions.find(s => s.subscriptionCode === subCode);
    if (sub && sub.status !== 'cancelled') {
      sub.status = 'cancelled';
      sub.cancelledAt = new Date().toISOString();
      save();
      logActivity('payment', `Subscription cancelled: ${sub.planName}`,
        `Subscription ${sub.id} was cancelled — code ${subCode}`);
    }
  }

  res.sendStatus(200); // always ack quickly so Paystack doesn't retry
});

app.use(express.json({ limit: '30mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// PWA — serve manifest.json with correct MIME type (Phase 7)
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

// PWA — serve service worker with correct scope (Phase 7)
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// Android APK download (Phase 7) — serve with correct MIME type
app.get('/creatihub-app.apk', (req, res) => {
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="creatihub-app.apk"');
  res.sendFile(path.join(__dirname, 'public', 'creatihub-app.apk'));
});

// The in-memory db object. For the JSON backend this is populated synchronously
// via getDb(). For the PostgreSQL backend it is hydrated asynchronously by
// dbBackend.load() during boot (see the async start() at the bottom).
let db;
if (!USE_POSTGRES) db = getDb();

// ---------------- Auth helpers ----------------
function auth(req, res, next) {
  const token = req.headers['x-token'];
  const userId = token && db.tokens[token];
  const user = userId && db.users.find(u => u && u.id === userId);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = user;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

function publicUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// ── Phase 8: Referral Campaign ────────────────────────────────────
const REFERRAL_BOUNTY_NGN = 3000; // ₦3,000 bounty per referred user (paid after first order)

// Send an in-app notification to a specific user (stored on their user object).
// The existing notify() function only creates global admin notifications.
function notifyUser(user, type, title, message) {
  if (!user) return;
  if (!Array.isArray(user.notifications)) user.notifications = [];
  user.notifications.unshift({
    id: uid('n'), type, title, message, read: false,
    at: new Date().toISOString()
  });
  // Keep last 100 notifications per user
  if (user.notifications.length > 100) user.notifications = user.notifications.slice(0, 100);
}

// Mark a user's notification as read
function markUserNotificationRead(user, notifId) {
  if (!user || !Array.isArray(user.notifications)) return;
  const n = user.notifications.find(x => x.id === notifId);
  if (n) n.read = true;
}

// Get unread notification count for a user
function userUnreadCount(user) {
  if (!user || !Array.isArray(user.notifications)) return 0;
  return user.notifications.filter(n => !n.read).length;
}

// Build a base URL for email links (from BASE_URL env or request context)
let cachedBaseUrl = process.env.BASE_URL || '';
function setBaseUrl(req) { if (!cachedBaseUrl) cachedBaseUrl = req.protocol + '://' + req.get('host'); }
function getBaseUrl() { return cachedBaseUrl || process.env.BASE_URL || 'https://creatihub.pages.dev'; }

// ---------------- Payment helpers ----------------
// Marks an order as paid (idempotent), fires notifications/activity, and
// kicks off automatic AI generation so deliverables are produced the
// moment payment is confirmed (via webhook or verify endpoint).
async function markOrderPaid(order, info = {}) {
  if (order.paymentStatus === 'paid') return order; // idempotent
  order.paymentStatus = 'paid';
  order.paidAt = info.paidAt || new Date().toISOString();
  order.paymentChannel = info.channel || 'card';
  if (info.amount != null) order.paidAmount = info.amount;
  if (info.currency) order.paidCurrency = info.currency;
  order.timeline.push({
    status: 'pending',
    at: new Date().toISOString(),
    note: `Payment confirmed via ${info.channel || 'card'}${info.source === 'webhook' ? ' [webhook]' : info.source === 'admin' ? ' [admin verified]' : ''}`
  });
  // Move the order into in_progress so the customer dashboard reflects
  // that work has begun, then trigger automatic AI generation.
  order.status = 'in_progress';
  order.timeline.push({
    status: 'in_progress',
    at: new Date().toISOString(),
    note: 'Payment received — AI generation started automatically.'
  });
  save();
  logActivity('payment', `Payment received for ${order.id}`,
    `${order.userName} paid $${order.price} for ${order.serviceName} (${order.packageName}) via ${info.channel || 'card'}${info.source === 'webhook' ? ' [webhook]' : info.source === 'admin' ? ' [admin verified]' : ''}`);
  notify('payment', `💳 Payment confirmed — ${order.id}`,
    `${order.userName} (${order.userEmail}) paid for:\n\n• Service: ${order.serviceName}\n• Package: ${order.packageName}\n• Amount: $${order.price}\n• Reference: ${order.paymentReference}\n• Channel: ${order.paymentChannel}\n\nThe order is now in your queue and AI generation has started.`);

  // ── Phase 8: Referral bounty — triggered on referred user's FIRST paid order ──
  // Find the user who placed this order. If they were referred, and this is
  // their first paid order, mark the referral bounty as "earned" and notify
  // both the referrer and admin. This only fires ONCE per referred user.
  try {
    const orderUser = db.users.find(u => u && u.id === order.userId);
    if (orderUser && orderUser.referredById) {
      // Check if this is the user's first PAID order
      const userPaidOrders = db.orders.filter(o => o.userId === order.userId && o.paymentStatus === 'paid');
      const isFirstPaidOrder = userPaidOrders.length === 1; // just this one

      if (isFirstPaidOrder) {
        // Find the referral record
        const referral = (db.referrals || []).find(r => r.referredId === order.userId && r.status === 'registered');
        if (referral) {
          referral.status = 'first_order';
          referral.bountyStatus = 'earned';
          referral.firstOrderAt = new Date().toISOString();
          referral.firstOrderId = order.id;
          save();

          // Notify the referrer
          const referrer = db.users.find(u => u && u.id === referral.referrerId);
          if (referrer) {
            notifyUser(referrer, 'referral',
              '🎉 Referral bounty earned!',
              `Great news! Your referral ${orderUser.name} just placed their first order (${order.serviceName}).\n\n` +
              `You've earned a referral bounty of ₦${REFERRAL_BOUNTY_NGN.toLocaleString()}!\n\n` +
              `The bounty will be paid to you after verification. Keep sharing your code ${referrer.referralCode} to earn more.`);
          }

          // Notify admin
          notify('referral', `🎉 Referral bounty earned — ₦${REFERRAL_BOUNTY_NGN.toLocaleString()} owed to ${referrer ? referrer.name : 'referrer'}`,
            `${orderUser.name} (${orderUser.email}) just placed their first paid order (${order.id}).\n\n` +
            `They were referred by ${referrer ? referrer.name : 'unknown'} (code: ${referral.referrerCode}).\n\n` +
            `Bounty: ₦${REFERRAL_BOUNTY_NGN.toLocaleString()} is now OWED to ${referrer ? referrer.name : 'the referrer'}.\n` +
            `Mark it as paid from the Admin → Referrals panel once you've sent the payment.`);

          logActivity('referral', `Referral bounty earned — ${referrer ? referrer.name : 'referrer'} → ${orderUser.name}`,
            `${orderUser.name} placed their first order (${order.id}). ₦${REFERRAL_BOUNTY_NGN.toLocaleString()} bounty is now owed to ${referrer ? referrer.name : 'the referrer'}.`);
        }
      }
    }
  } catch (refErr) {
    console.error('[referral] Error processing first-order bounty:', refErr.message);
  }
  // ── End Phase 8 referral hook ──

  // Fire-and-forget generation: we don't await it here so the webhook /
  // verify response returns immediately to Paystack / the client. The
  // generation result is persisted on the order when it completes.
  autoGenerateDeliverables(order).catch(err => {
    console.error('[auto-generate] async error for', order.id, err.message);
  });
  return order;
}

// Runs the AI generation engine for an order and stores the deliverables.
// Called automatically after payment confirmation. Errors are logged and
// recorded on the order timeline so the admin can retry manually.
//
// PHASE 6 — Tiered Fulfillment:
//   Before generating, we check whether the configured AI provider(s) can
//   actually produce a REAL deliverable for this service kind. If not
//   (e.g. image services on the free Gemini tier, which has 0 image
//   quota), the order is flagged for MANUAL fulfillment:
//     • order.fulfillmentMode = 'manual'
//     • The customer sees a "Processing — our team is hand-crafting your
//       order" panel (NOT a concept brief file).
//     • The admin receives a detailed notification of exactly what the
//       customer wants, and can upload the finished work from the admin
//       dashboard once it's ready.
//   Orders the AI CAN fulfill proceed as before (auto-generated files).
async function autoGenerateDeliverables(order) {
  if (process.env.AUTO_GENERATE === 'false') return; // allow opt-out
  const { canAutoFulfill, generate, modeLabel } = require('./generator');

  // --- Capability check: can the AI produce a real deliverable? ---
  const cap = canAutoFulfill(order.serviceId);
  if (!cap.canAutoFulfill) {
    // This order must be fulfilled manually by the admin.
    order.fulfillmentMode = 'manual';
    order.manualReason = cap.reason;
    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({
      status: 'in_progress',
      at: new Date().toISOString(),
      note: 'Order queued for manual fulfillment — the AI cannot auto-generate this deliverable with current free-tier keys. The admin has been notified and will create + upload the finished work.'
    });
    save();
    // Notify admin with the FULL details of what the customer wants.
    notify('order', `✋ Manual fulfillment needed — ${order.id}`,
      `A paid order requires your hands-on work (the free AI keys can't auto-generate it).\n\n` +
      `WHAT THE CUSTOMER WANTS:\n` +
      `• Order: ${order.id}\n` +
      `• Service: ${order.serviceName} (${order.packageName})\n` +
      `• Customer: ${order.userName} (${order.userEmail})\n` +
      `• Price: $${order.price}\n` +
      `• Customer's brief: ${(order.requirements || '(no specific brief — use your creative judgement)').slice(0, 500)}\n\n` +
      `REASON: ${cap.reason}\n\n` +
      `NEXT STEPS:\n` +
      `1. Create the deliverable yourself (or using any tool you have).\n` +
      `2. Go to the admin Orders panel → find order ${order.id}.\n` +
      `3. Click "Upload Deliverable" and attach the finished file(s).\n` +
      `4. The customer will be notified automatically and can download from their dashboard.\n\n` +
      `The customer currently sees a "Processing" status — they know work is underway.`);
    logAiActivity('order', 'system', 'order queued for manual fulfillment', `${order.id} — ${order.serviceName} — reason: ${cap.reason}`);
    return; // do NOT call the generator
  }

  // --- AI can auto-fulfill: proceed with generation ---
  order.fulfillmentMode = 'auto';
  try {
    const result = await generate(order);
    if (!Array.isArray(order.deliverables)) order.deliverables = [];
    order.deliverables.push({ runId: Date.now(), mode: result.mode, items: result.deliverables, at: new Date().toISOString() });
    order.timeline.push({
      status: 'in_progress',
      at: new Date().toISOString(),
      note: `AI deliverables generated (${result.mode} mode): ${result.deliverables.length} file(s)`
    });
    save();
    logAiActivity('order', 'system', 'auto-generated deliverables', `${order.id} — ${order.serviceName} — ${result.mode} mode`);
    notify('order', `✅ Deliverables ready — ${order.id}`,
      `AI generation completed for ${order.serviceName}.\n\n• Files: ${result.deliverables.length}\n• Mode: ${result.mode}\n\nThe customer can now download their deliverables from the dashboard.`);
    // Notify customer that deliverables are ready
    if (order.userEmail) {
      sendEmail(order.userEmail, `[CreatiHub] Your order ${order.id} deliverables are ready! 🎉`,
        `Hi ${order.userName || 'there'},\n\nGreat news! Your deliverables for "${order.serviceName}" are ready.\n\n• Order: ${order.id}\n• Files: ${result.deliverables.length} file(s)\n• Service: ${order.serviceName} (${order.packageName})\n\nYou can download them now from your dashboard:\n${getBaseUrl()}/dashboard\n\nIf you'd like any changes, you can request a revision directly from your order page.\n\nThank you for choosing CreatiHub!\n\n— The CreatiHub Team`);
    }
  } catch (err) {
    console.error('[auto-generate] failed for', order.id, err.message);
    // If the generator signalled manual fulfillment is required (e.g. image
    // quota exhausted mid-request), route to manual instead of failing.
    if (err.code === 'MANUAL_FULFILLMENT_REQUIRED') {
      order.fulfillmentMode = 'manual';
      order.manualReason = err.message.replace(/^IMAGE_MANUAL_FULFILLMENT_REQUIRED:\s*/, '');
      order.timeline.push({
        status: 'in_progress',
        at: new Date().toISOString(),
        note: 'AI image generation quota exhausted — order queued for manual fulfillment. Admin notified.'
      });
      save();
      notify('order', `✋ Manual fulfillment needed — ${order.id}`,
        `A paid order requires your hands-on work (AI image quota was exhausted mid-request).\n\n` +
        `WHAT THE CUSTOMER WANTS:\n` +
        `• Order: ${order.id}\n` +
        `• Service: ${order.serviceName} (${order.packageName})\n` +
        `• Customer: ${order.userName} (${order.userEmail})\n` +
        `• Price: $${order.price}\n` +
        `• Customer's brief: ${(order.requirements || '(no specific brief)').slice(0, 500)}\n\n` +
        `NEXT STEPS:\n1. Create the deliverable.\n2. Admin Orders panel → order ${order.id} → "Upload Deliverable".\n3. Customer is notified automatically.`);
      return;
    }
    order.timeline.push({
      status: 'in_progress',
      at: new Date().toISOString(),
      note: `Auto-generation failed: ${err.message}. Use the Generate button in the admin panel to retry, or upload a deliverable manually.`
    });
    save();
    notify('order', `⚠️ Generation failed — ${order.id}`,
      `AI generation could not complete for ${order.serviceName}.\n\nError: ${err.message}\n\nRetry from the admin Orders panel, or click "Upload Deliverable" to add the finished work manually.`);
  }
}

// ---------------- Auth routes ----------------
app.post('/api/register', (req, res) => {
  const { name, email, password, country, currency, referralCode } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const emailLower = email.toLowerCase().trim();
  if (db.users.some(u => u && u.email === emailLower)) return res.status(409).json({ error: 'Email already registered' });

  // ── Phase 8: Validate referral code if provided ──────────────────
  let referrer = null;
  let cleanRefCode = null;
  if (referralCode && referralCode.trim()) {
    cleanRefCode = referralCode.trim().toUpperCase();
    referrer = db.users.find(u => u && u.referralCode === cleanRefCode);
    if (!referrer) return res.status(400).json({ error: 'Invalid referral code. Please check it or leave blank.' });
    // Prevent self-referral (can't happen at registration but guard anyway)
  }

  // ── Phase 8: Generate unique referral code for the new user ───────
  const myReferralCode = generateReferralCode(db);

  const user = {
    id: uid('u'), name: name.trim(), email: emailLower,
    password: hashPassword(password), role: 'user',
    country: country || 'US', currency: currency || 'USD',
    referralCode: myReferralCode,            // this user's own referral code
    referredBy: referrer ? referrer.referralCode : null,  // who referred them
    referredById: referrer ? referrer.id : null,
    notifications: [],                       // per-user in-app notifications
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  const token = makeToken();
  db.tokens[token] = user.id;

  // ── Phase 8: Create referral activity record + notifications ──────
  if (referrer) {
    const referral = {
      id: uid('ref'),
      referrerId: referrer.id,
      referrerName: referrer.name,
      referrerCode: referrer.referralCode,
      referredId: user.id,
      referredName: user.name,
      referredEmail: user.email,
      status: 'registered',              // registered → first_order
      bountyAmount: REFERRAL_BOUNTY_NGN,
      bountyStatus: 'pending',           // pending → earned → paid
      createdAt: new Date().toISOString(),
      firstOrderAt: null,
      paidAt: null
    };
    db.referrals.push(referral);

    // Notify the referrer
    notifyUser(referrer, 'referral',
      '🎁 New referral signup!',
      `${user.name} just registered using your referral code ${referrer.referralCode}!\n\n` +
      `You'll earn ₦${REFERRAL_BOUNTY_NGN.toLocaleString()} when they place their first order. ` +
      `We'll notify you the moment that happens.`);

    // Notify admin
    notify('referral', `🎁 New referral registration — ${user.name}`,
      `${user.name} (${user.email}) registered using ${referrer.name}'s referral code ${referrer.referralCode}.\n\n` +
      `Bounty: ₦${REFERRAL_BOUNTY_NGN.toLocaleString()} — will be owed to ${referrer.name} once ${user.name} places their first order.`);

    logActivity('referral', `New referral: ${referrer.name} → ${user.name}`,
      `${user.name} registered with referral code ${referrer.referralCode} (owned by ${referrer.name}). Bounty ₦${REFERRAL_BOUNTY_NGN.toLocaleString()} pending first order.`);
  }

  save();
  res.json({ token, user: publicUser(user) });
});

// ---------------------------------------------------------------------------
// Auth rate limiter — prevents brute-force attacks on login / forgot / reset.
// Tracks attempts per IP address in memory. 10 attempts per 15-minute window.
// Resets on successful login. Does NOT block the admin dashboard from working.
// ---------------------------------------------------------------------------
const authAttempts = new Map(); // ip -> { count, firstAt }
const AUTH_RATE_LIMIT_MAX = 15;
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function authRateLimit(req, res, next) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim();
  const now = Date.now();
  let entry = authAttempts.get(ip);
  if (!entry || now - entry.firstAt > AUTH_RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, firstAt: now };
    authAttempts.set(ip, entry);
  }
  entry.count++;
  if (entry.count > AUTH_RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.firstAt + AUTH_RATE_LIMIT_WINDOW_MS - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many attempts. Please try again in a few minutes.' });
  }
  next();
}

// Clear rate-limit counter on successful login
function clearAuthRateLimit(req) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim();
  authAttempts.delete(ip);
}

app.post('/api/login', authRateLimit, (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find(u => u && u.email === (email || '').toLowerCase().trim());
  if (!user || user.password !== hashPassword(password || '')) {
    // Only FAILED login attempts count toward rate limit
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = makeToken();
  db.tokens[token] = user.id;
  save();
  clearAuthRateLimit(req);  // successful login clears the counter
  res.json({ token, user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

// ── Phase 8: User referral endpoints ──────────────────────────────
// Get the current user's referral code + summary stats
app.get('/api/referrals/my-code', auth, (req, res) => {
  const user = req.user;
  // Ensure user has a referral code (backfill safety)
  if (!user.referralCode) {
    user.referralCode = generateReferralCode(db);
    save();
  }

  const myReferrals = (db.referrals || []).filter(r => r.referrerId === user.id);
  const totalReferred = myReferrals.length;
  const totalOrdered = myReferrals.filter(r => r.status === 'first_order').length;
  const totalEarned = myReferrals.filter(r => r.bountyStatus === 'earned' || r.bountyStatus === 'paid').length;
  const totalPaid = myReferrals.filter(r => r.bountyStatus === 'paid').length;
  const totalPendingBounty = myReferrals.filter(r => r.bountyStatus === 'earned').length * REFERRAL_BOUNTY_NGN;
  const totalEarnedBounty = myReferrals.filter(r => r.bountyStatus === 'earned' || r.bountyStatus === 'paid').length * REFERRAL_BOUNTY_NGN;
  const totalPaidBounty = myReferrals.filter(r => r.bountyStatus === 'paid').length * REFERRAL_BOUNTY_NGN;

  const baseUrl = getBaseUrl();
  res.json({
    referralCode: user.referralCode,
    shareLink: `${baseUrl}/auth?mode=register&ref=${user.referralCode}`,
    bountyPerReferral: REFERRAL_BOUNTY_NGN,
    stats: {
      totalReferred,
      totalOrdered,
      totalEarned,
      totalPaid,
      totalPendingBounty,     // earned but not yet paid (₦)
      totalEarnedBounty,      // total bounty earned (₦)
      totalPaidBounty         // total bounty actually paid (₦)
    },
    referrals: myReferrals.map(r => ({
      id: r.id,
      referredName: r.referredName,
      status: r.status,             // 'registered' or 'first_order'
      bountyStatus: r.bountyStatus, // 'pending', 'earned', 'paid'
      bountyAmount: r.bountyAmount,
      createdAt: r.createdAt,
      firstOrderAt: r.firstOrderAt,
      paidAt: r.paidAt
    }))
  });
});

// Get the current user's notifications
app.get('/api/notifications', auth, (req, res) => {
  const user = req.user;
  if (!Array.isArray(user.notifications)) user.notifications = [];
  const unread = userUnreadCount(user);
  res.json({
    notifications: user.notifications.slice(0, 50),
    unread
  });
});

// Mark a user notification as read
app.put('/api/notifications/:id/read', auth, (req, res) => {
  markUserNotificationRead(req.user, req.params.id);
  save();
  res.json({ ok: true });
});

// Mark all user notifications as read
app.post('/api/notifications/read-all', auth, (req, res) => {
  if (Array.isArray(req.user.notifications)) {
    req.user.notifications.forEach(n => n.read = true);
  }
  save();
  res.json({ ok: true });
});

app.post('/api/logout', auth, (req, res) => {
  const token = req.headers['x-token'];
  delete db.tokens[token];
  save();
  res.json({ ok: true });
});

// ---------------- Password reset (works for BOTH users and admins) ----------------
// Step 1: request a reset code. In production this is emailed; in demo mode the
// code is returned in the response so the flow can be completed end-to-end.
app.post('/api/forgot-password', authRateLimit, (req, res) => {
  const { email } = req.body || {};
  const emailLower = (email || '').toLowerCase().trim();
  const user = db.users.find(u => u && u.email === emailLower);
  // Always respond the same way so the endpoint can't be used to enumerate accounts
  if (!user) {
    return res.json({ ok: true, message: 'If that email is registered, a reset code has been sent.' });
  }
  const code = createResetCode(user.id);
  // Queue a real email (wire SMTP/provider in db.js -> sendEmail to actually deliver)
  sendEmail(user.email, '[CreatiHub] Your password reset code',
    `Hi ${user.name},\n\nYour CreatiHub password reset code is: ${code}\n\nIt expires in 15 minutes. If you did not request this, you can ignore this email.\n\n— CreatiHub Security`);
  logActivity('security', 'Password reset requested', `${user.name} (${user.email}) requested a reset code`);
  // Only expose the reset code in the API response when running in demo mode
  // (no Paystack secret key configured). In production with live keys, the code
  // is only delivered via email and NEVER returned by the API.
  const isProduction = !!process.env.PAYSTACK_SECRET_KEY;
  const response = {
    ok: true,
    message: 'If that email is registered, a reset code has been sent.'
  };
  if (!isProduction) {
    response.demoCode = code;
    response.role = user.role;
  }
  res.json(response);
});

// Step 2: submit code + new password
app.post('/api/reset-password', authRateLimit, (req, res) => {
  const { email, code, password } = req.body || {};
  if (!email || !code || !password) return res.status(400).json({ error: 'Email, code and new password are required' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const user = db.users.find(u => u && u.email === email.toLowerCase().trim());
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset code' });
  const userId = verifyResetCode(code);
  if (!userId || userId !== user.id) return res.status(400).json({ error: 'Invalid or expired reset code' });
  user.password = hashPassword(password);
  consumeResetCode(code);
  revokeUserTokens(user.id);           // force re-login everywhere with new password
  save();
  logActivity('security', 'Password reset completed', `${user.name} (${user.email}) reset their password`);
  res.json({ ok: true, message: 'Password updated. Please log in with your new password.' });
});

// ---------------- Logged-in credential changes (users AND admins) ----------------
// Change password while logged in (requires current password)
app.put('/api/me/password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required' });
  if (String(newPassword).length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  if (req.user.password !== hashPassword(currentPassword)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  req.user.password = hashPassword(newPassword);
  // Keep the current session alive, revoke all other sessions
  const currentToken = req.headers['x-token'];
  Object.keys(db.tokens).forEach(t => { if (db.tokens[t] === req.user.id && t !== currentToken) delete db.tokens[t]; });
  save();
  logActivity('security', 'Password changed', `${req.user.name} (${req.user.email}) changed their password`);
  res.json({ ok: true, message: 'Password updated successfully' });
});

// Change login email (requires password confirmation)
app.put('/api/me/email', auth, (req, res) => {
  const { newEmail, password } = req.body || {};
  const emailLower = (newEmail || '').toLowerCase().trim();
  if (!emailLower || !password) return res.status(400).json({ error: 'New email and password are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return res.status(400).json({ error: 'Please enter a valid email address' });
  if (req.user.password !== hashPassword(password)) return res.status(401).json({ error: 'Password is incorrect' });
  if (db.users.some(u => u && u.email === emailLower && u.id !== req.user.id)) {
    return res.status(409).json({ error: 'That email is already in use by another account' });
  }
  const old = req.user.email;
  req.user.email = emailLower;
  save();
  logActivity('security', 'Login email changed', `${req.user.name} changed email from ${old} to ${emailLower}`);
  res.json({ ok: true, message: 'Login email updated', user: publicUser(req.user) });
});

app.put('/api/me/currency', auth, (req, res) => {
  const { currency } = req.body || {};
  if (!CURRENCY_RATES[currency]) return res.status(400).json({ error: 'Unsupported currency' });
  req.user.currency = currency;
  save();
  res.json({ user: publicUser(req.user) });
});

// ---------------- Services ----------------
app.get('/api/services', (req, res) => {
  const cur = req.query.currency || 'USD';
  const services = db.services.map(s => ({
    ...s,
    packages: s.packages.map(p => ({ ...p, localPrice: convertPrice(p.price, cur) }))
  }));
  res.json({ services });
});

app.get('/api/services/:id', (req, res) => {
  const svc = db.services.find(s => s.id === req.params.id);
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  const cur = req.query.currency || 'USD';
  res.json({ service: { ...svc, packages: svc.packages.map(p => ({ ...p, localPrice: convertPrice(p.price, cur) })) } });
});

// ---------------- Learning / Education ----------------
// Public curriculum endpoints. No auth required — learning content is open to
// everyone so prospective customers (and existing clients) can explore what each
// creative service involves, from beginner to advanced.

// All tracks (catalog). Includes a computed lessonCount so the UI doesn't have to
// tally lessons client-side.
app.get('/api/tracks', (req, res) => {
  const tracks = (db.tracks || []).map(t => {
    const lessons = (db.lessons || []).filter(l => l.trackId === t.id);
    return {
      ...t,
      lessonCount: lessons.length,
      levels: [...new Set(lessons.map(l => l.level))]
    };
  });
  res.json({ tracks });
});

// Single track with its ordered lessons (summary only — no full section bodies
// to keep the payload small; the lesson page fetches full content per lesson).
app.get('/api/tracks/:id', (req, res) => {
  const track = (db.tracks || []).find(t => t.id === req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found' });
  const lessons = (db.lessons || [])
    .filter(l => l.trackId === track.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(({ sections, ...summary }) => summary); // strip heavy content
  res.json({ track: { ...track, lessonCount: lessons.length }, lessons });
});

// All lessons (lightweight summaries, no section bodies).
app.get('/api/lessons', (req, res) => {
  const lessons = (db.lessons || [])
    .map(({ sections, ...summary }) => summary)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json({ lessons });
});

// Single lesson with full content + prev/next navigation within its track.
app.get('/api/lessons/:id', (req, res) => {
  const lesson = (db.lessons || []).find(l => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
  const trackLessons = (db.lessons || [])
    .filter(l => l.trackId === lesson.trackId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const idx = trackLessons.findIndex(l => l.id === lesson.id);
  const track = (db.tracks || []).find(t => t.id === lesson.trackId);
  const service = lesson.serviceId ? (db.services || []).find(s => s.id === lesson.serviceId) : null;
  res.json({
    lesson,
    track: track || null,
    service: service ? { id: service.id, name: service.name, category: service.category } : null,
    prev: idx > 0 ? { id: trackLessons[idx - 1].id, title: trackLessons[idx - 1].title } : null,
    next: idx < trackLessons.length - 1 ? { id: trackLessons[idx + 1].id, title: trackLessons[idx + 1].title } : null
  });
});

// ===================================================================
// TRAINING PROGRAMS & INSTALLMENT ENROLLMENTS
// ===================================================================
// Paid, instructor-led training programs with flexible installment plans.
// Students enroll in a program tier, choose an installment option (full,
// 2-pay, 3-pay, or weekly/monthly), and pay each installment via Paystack.
// Modules unlock progressively as installments are paid.

// All training programs (public catalog)
app.get('/api/training', (req, res) => {
  const programs = (db.trainingPrograms || []).map(p => ({
    id: p.id, title: p.name || p.title, name: p.name || p.title,
    icon: p.icon, category: p.category, tagline: p.tagline,
    description: p.description, level: p.level, durationWeeks: p.durationWeeks,
    image: p.image, instructor: p.instructor, rating: p.rating,
    enrolled: p.enrolled, maxStudents: p.maxStudents,
    highlights: p.highlights, tracks: p.tracks,
    tierCount: (p.tiers || []).length,
    priceFrom: Math.min(...(p.tiers || []).map(t => t.price)),
    modules: p.modules || []
  }));
  res.json({ programs });
});

// Single training program (full detail including tiers + installment options)
app.get('/api/training/:id', (req, res) => {
  const p = (db.trainingPrograms || []).find(t => t.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Training program not found' });
  // Check if current user is already enrolled
  let myEnrollment = null;
  if (req.user) {
    myEnrollment = (db.enrollments || []).find(e =>
      e.userId === req.user.id && e.programId === p.id && e.status !== 'cancelled'
    );
  }
  res.json({ program: p, enrollment: myEnrollment || null });
});

// Enroll in a training program (creates enrollment + initializes first payment)
app.post('/api/training/enroll', auth, async (req, res) => {
  const { programId, tierId, installmentPlanId } = req.body || {};
  const program = (db.trainingPrograms || []).find(p => p.id === programId);
  if (!program) return res.status(404).json({ error: 'Training program not found' });
  const tier = (program.tiers || []).find(t => t.id === tierId);
  if (!tier) return res.status(404).json({ error: 'Tier not found' });
  const instPlan = (tier.installments || []).find(i => i.id === installmentPlanId);
  if (!instPlan) return res.status(404).json({ error: 'Installment plan not found' });

  // Check for existing active enrollment
  const existing = (db.enrollments || []).find(e =>
    e.userId === req.user.id && e.programId === programId && e.status !== 'cancelled'
  );
  if (existing) return res.status(409).json({ error: 'You are already enrolled in this program', enrollment: existing });

  const perPayment = instPlan.perPayment;
  const displayCurrency = req.user.currency || 'USD';
  const charge = paystack.toChargeAmount(perPayment, displayCurrency, CURRENCY_RATES);
  const reference = 'TRN' + Date.now().toString(36).toUpperCase() + uid('e').slice(2, 8).toUpperCase();

  const enrollment = {
    id: 'TRN-' + (db.orderCounter++),
    userId: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    programId: program.id,
    programTitle: program.title || program.name,
    programIcon: program.icon,
    tierId: tier.id,
    tierName: tier.name,
    installmentPlanId: instPlan.id,
    installmentPlanLabel: instPlan.label,
    installmentCount: instPlan.count,
    installmentDiscountPct: instPlan.discountPct || 0,
    totalAmount: instPlan.total,
    perPayment: perPayment,
    currency: 'USD',
    status: 'active',              // active | completed | cancelled
    paymentStatus: 'partial',      // partial | paid | overdue
    paymentsMade: 0,
    payments: [],                  // [{ installmentNumber, amount, reference, status, paidAt }]
    unlockedModules: [1],          // week 1 always unlocked on enrollment
    nextPaymentDue: instPlan.count > 1 ? computeNextInstallmentDate(instPlan, program.durationWeeks, 1) : null,
    createdAt: new Date().toISOString(),
    timeline: [{ status: 'enrolled', at: new Date().toISOString(), note: `Enrolled in ${program.title || program.name} (${tier.name}) — ${instPlan.label}` }]
  };

  const baseUrl = process.env.PAYSTACK_CALLBACK_URL ||
    (req.protocol + '://' + req.get('host') + '/payment/callback');

  try {
    const init = await paystack.initializeTransaction({
      email: req.user.email,
      amount: charge.amount,
      currency: charge.currency,
      reference,
      callbackUrl: baseUrl,
      metadata: {
        enrollment_id: enrollment.id,
        type: 'training_installment',
        installment_number: 1,
        program: program.title || program.name,
        tier: tier.name,
        custom_fields: [
          { display_name: 'Enrollment ID', variable_name: 'enrollment_id', value: enrollment.id },
          { display_name: 'Program', variable_name: 'program', value: program.title || program.name },
          { display_name: 'Tier', variable_name: 'tier', value: tier.name },
          { display_name: 'Installment', variable_name: 'installment', value: '1 of ' + instPlan.count },
          { display_name: 'Plan', variable_name: 'plan', value: instPlan.label }
        ]
      }
    });

    // Record the pending first payment
    enrollment.payments.push({
      installmentNumber: 1,
      amount: perPayment,
      reference,
      status: 'pending',
      chargeCurrency: charge.currency,
      chargeAmount: charge.amount,
      accessCode: init.data.access_code,
      createdAt: new Date().toISOString()
    });

    db.enrollments.push(enrollment);
    save();
    logActivity('training', `New training enrollment ${enrollment.id}`,
      `${req.user.name} enrolled in ${program.title || program.name} (${tier.name}) — ${instPlan.label} — $${perPayment}/payment — ref ${reference}`);

    res.json({
      enrollment,
      payment: {
        reference,
        accessCode: init.data.access_code,
        authorizationUrl: init.data.authorization_url,
        amount: charge.amount,
        currency: charge.currency,
        publicKey: paystack.publicKey(),
        demo: paystack.isDemo(),
        installmentNumber: 1,
        totalInstallments: instPlan.count
      }
    });
  } catch (e) {
    res.status(502).json({ error: 'Could not initialize payment: ' + e.message });
  }
});

// Pay the next installment on an existing enrollment
app.post('/api/training/:id/pay-installment', auth, async (req, res) => {
  const enrollment = (db.enrollments || []).find(e => e.id === req.params.id && e.userId === req.user.id);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
  if (enrollment.paymentStatus === 'paid') return res.status(400).json({ error: 'All installments already paid' });

  const nextNum = enrollment.paymentsMade + 1;
  if (nextNum > enrollment.installmentCount) return res.status(400).json({ error: 'No more installments due' });

  const program = (db.trainingPrograms || []).find(p => p.id === enrollment.programId);
  const tier = program && program.tiers ? program.tiers.find(t => t.id === enrollment.tierId) : null;
  const instPlan = tier && tier.installments ? tier.installments.find(i => i.id === enrollment.installmentPlanId) : null;
  const perPayment = enrollment.perPayment;

  const displayCurrency = req.user.currency || 'USD';
  const charge = paystack.toChargeAmount(perPayment, displayCurrency, CURRENCY_RATES);
  const reference = 'TRN' + Date.now().toString(36).toUpperCase() + uid('e').slice(2, 8).toUpperCase();

  const baseUrl = process.env.PAYSTACK_CALLBACK_URL ||
    (req.protocol + '://' + req.get('host') + '/payment/callback');

  try {
    const init = await paystack.initializeTransaction({
      email: req.user.email,
      amount: charge.amount,
      currency: charge.currency,
      reference,
      callbackUrl: baseUrl,
      metadata: {
        enrollment_id: enrollment.id,
        type: 'training_installment',
        installment_number: nextNum,
        program: enrollment.programTitle,
        custom_fields: [
          { display_name: 'Enrollment ID', variable_name: 'enrollment_id', value: enrollment.id },
          { display_name: 'Program', variable_name: 'program', value: enrollment.programTitle },
          { display_name: 'Installment', variable_name: 'installment', value: nextNum + ' of ' + enrollment.installmentCount }
        ]
      }
    });

    enrollment.payments.push({
      installmentNumber: nextNum,
      amount: perPayment,
      reference,
      status: 'pending',
      chargeCurrency: charge.currency,
      chargeAmount: charge.amount,
      accessCode: init.data.access_code,
      createdAt: new Date().toISOString()
    });
    save();

    res.json({
      enrollment,
      payment: {
        reference,
        accessCode: init.data.access_code,
        authorizationUrl: init.data.authorization_url,
        amount: charge.amount,
        currency: charge.currency,
        publicKey: paystack.publicKey(),
        demo: paystack.isDemo(),
        installmentNumber: nextNum,
        totalInstallments: enrollment.installmentCount
      }
    });
  } catch (e) {
    res.status(502).json({ error: 'Could not initialize payment: ' + e.message });
  }
});

// List current user's enrollments
app.get('/api/training/enrollments/mine', auth, (req, res) => {
  const mine = (db.enrollments || []).filter(e => e.userId === req.user.id);
  res.json({ enrollments: mine });
});

// Get a single enrollment (with program detail for the dashboard)
app.get('/api/training/enrollments/:id', auth, (req, res) => {
  const enrollment = (db.enrollments || []).find(e => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
  if (enrollment.userId !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Not authorized' });
  const program = (db.trainingPrograms || []).find(p => p.id === enrollment.programId);
  res.json({ enrollment, program });
});

// Helper: compute the next installment due date based on plan type + program duration
function computeNextInstallmentDate(instPlan, durationWeeks, paymentsMade) {
  if (instPlan.count <= 1) return null;
  const now = new Date();
  if (instPlan.id === 'full') return null;
  if (instPlan.id === 'two') {
    // Second payment at the midpoint
    const midWeek = Math.ceil(durationWeeks / 2);
    return new Date(now.getTime() + midWeek * 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (instPlan.id === 'three') {
    // Payments at 1/3 and 2/3 through the program
    const intervalWeeks = Math.ceil(durationWeeks / 3);
    return new Date(now.getTime() + intervalWeeks * (paymentsMade + 1) * 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (instPlan.id === 'monthly' || instPlan.id === 'weekly') {
    // Weekly payments
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  return null;
}

// Helper: unlock modules based on payments made (called from payment verification)
function unlockTrainingModules(enrollment, program) {
  if (!enrollment || !program) return;
  const totalPayments = enrollment.installmentCount;
  const paid = enrollment.paymentsMade;
  const totalModules = (program.modules || []).length;
  // Proportionally unlock modules based on payment progress
  const unlockedCount = Math.ceil((paid / totalPayments) * totalModules);
  enrollment.unlockedModules = [];
  for (let i = 1; i <= unlockedCount; i++) enrollment.unlockedModules.push(i);
  // Always at least week 1
  if (!enrollment.unlockedModules.includes(1)) enrollment.unlockedModules.push(1);
  if (paid >= totalPayments) {
    enrollment.paymentStatus = 'paid';
    enrollment.status = 'completed';
    enrollment.nextPaymentDue = null;
  }
}

// ---------------- AI Training: Lesson Generation + AI Tutor ----------------

// Generate (or retrieve cached) AI lesson content for a specific module
app.get('/api/training/:programId/lessons/:week', auth, async (req, res) => {
  const program = (db.trainingPrograms || []).find(p => p.id === req.params.programId);
  if (!program) return res.status(404).json({ error: 'Training program not found' });
  const mod = (program.modules || []).find(m => m.week === parseInt(req.params.week));
  if (!mod) return res.status(404).json({ error: 'Module not found' });

  // Check the user's enrollment to verify module is unlocked
  const enrollment = (db.enrollments || []).find(e =>
    e.userId === req.user.id && e.programId === program.id && e.status !== 'cancelled'
  );
  if (!enrollment) return res.status(403).json({ error: 'You are not enrolled in this program' });
  if (!enrollment.unlockedModules.includes(mod.week))
    return res.status(403).json({ error: 'This module is locked. Complete your next installment to unlock it.' });

  // Check for cached lesson content
  if (!enrollment.lessonCache) enrollment.lessonCache = {};
  const cacheKey = 'week_' + mod.week;

  if (enrollment.lessonCache[cacheKey]) {
    return res.json({
      lesson: enrollment.lessonCache[cacheKey],
      module: mod,
      program: { title: program.title, category: program.category, level: program.level, durationWeeks: program.durationWeeks },
      cached: true
    });
  }

  try {
    const lesson = await generateLesson(program, mod, enrollment.tierName);
    enrollment.lessonCache[cacheKey] = lesson;
    save();
    res.json({
      lesson,
      module: mod,
      program: { title: program.title, category: program.category, level: program.level, durationWeeks: program.durationWeeks },
      cached: false
    });
  } catch (e) {
    res.status(502).json({ error: 'Could not load lesson: ' + e.message });
  }
});

// AI Tutor chat — student asks a question about a lesson
app.post('/api/training/:programId/tutor/:week', auth, async (req, res) => {
  const program = (db.trainingPrograms || []).find(p => p.id === req.params.programId);
  if (!program) return res.status(404).json({ error: 'Training program not found' });
  const mod = (program.modules || []).find(m => m.week === parseInt(req.params.week));
  if (!mod) return res.status(404).json({ error: 'Module not found' });

  const enrollment = (db.enrollments || []).find(e =>
    e.userId === req.user.id && e.programId === program.id && e.status !== 'cancelled'
  );
  if (!enrollment) return res.status(403).json({ error: 'You are not enrolled in this program' });
  if (!enrollment.unlockedModules.includes(mod.week))
    return res.status(403).json({ error: 'This module is locked.' });

  const { question, conversationHistory } = req.body || {};
  if (!question || !question.trim()) return res.status(400).json({ error: 'Question is required' });

  // Get the lesson content (from cache or generate)
  const cacheKey = 'week_' + mod.week;
  const lessonContent = enrollment.lessonCache && enrollment.lessonCache[cacheKey] ? enrollment.lessonCache[cacheKey] : '';

  try {
    const reply = await tutorChat(program, mod, lessonContent, question.trim(), conversationHistory || []);
    res.json({ reply });
  } catch (e) {
    res.status(502).json({ error: 'Tutor is unavailable right now. Please try again in a moment.' });
  }
});

// ---------------- Admin: Training Oversight ----------------

// Admin overview of all training enrollments
app.get('/api/admin/training/enrollments', auth, adminOnly, (req, res) => {
  const enrollments = (db.enrollments || []).map(e => {
    const program = (db.trainingPrograms || []).find(p => p.id === e.programId);
    return {
      ...e,
      programImage: program ? program.image : null,
      programCategory: program ? program.category : null,
      totalModules: program ? (program.modules || []).length : 0,
      unlockedCount: (e.unlockedModules || []).length,
      progressPct: program && program.modules ?
        Math.round(((e.unlockedModules || []).length / program.modules.length) * 100) : 0,
      paymentPct: e.installmentCount > 0 ?
        Math.round((e.paymentsMade / e.installmentCount) * 100) : 100
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Summary stats
  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
  const totalRevenue = enrollments.reduce((sum, e) => sum + (e.paymentsMade * e.perPayment), 0);
  const pendingRevenue = enrollments.reduce((sum, e) =>
    sum + ((e.installmentCount - e.paymentsMade) * e.perPayment), 0);
  const partialPayers = enrollments.filter(e => e.paymentStatus === 'partial').length;

  // Group by program
  const byProgram = {};
  enrollments.forEach(e => {
    if (!byProgram[e.programId]) byProgram[e.programId] = { programTitle: e.programTitle, count: 0, revenue: 0 };
    byProgram[e.programId].count++;
    byProgram[e.programId].revenue += e.paymentsMade * e.perPayment;
  });

  res.json({
    enrollments,
    stats: {
      totalEnrollments, activeEnrollments, completedEnrollments,
      totalRevenue, pendingRevenue, partialPayers,
      programsByPopularity: Object.values(byProgram).sort((a, b) => b.count - a.count)
    }
  });
});

// Admin: get all training programs (for management view)
app.get('/api/admin/training/programs', auth, adminOnly, (req, res) => {
  const programs = (db.trainingPrograms || []).map(p => {
    const enrollments = (db.enrollments || []).filter(e => e.programId === p.id);
    return {
      ...p,
      enrollmentCount: enrollments.length,
      activeCount: enrollments.filter(e => e.status === 'active').length,
      completedCount: enrollments.filter(e => e.status === 'completed').length,
      revenue: enrollments.reduce((sum, e) => sum + (e.paymentsMade * e.perPayment), 0)
    };
  });
  res.json({ programs });
});

// ---------------- Admin: Email Broadcast System ----------------

// Get email template types (for the admin UI)
app.get('/api/admin/email/templates', auth, adminOnly, (req, res) => {
  res.json({ templates: EMAIL_TYPES, aiProvider: aiProviderLabel() });
});

// AI-generate an email draft
app.post('/api/admin/email/generate', auth, adminOnly, async (req, res) => {
  const { type, customPrompt, context } = req.body || {};
  if (!type) return res.status(400).json({ error: 'Email type is required' });
  try {
    const draft = await generateEmail(type, customPrompt || '', context || '');
    // Parse subject and body
    let subject = '', body = draft;
    const subjectMatch = draft.match(/^Subject:\s*(.+)$/im);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      body = draft.substring(subjectMatch.index + subjectMatch[0].length).trim();
    }
    res.json({ subject, body, raw: draft, aiProvider: aiProviderLabel() });
  } catch (e) {
    res.status(502).json({ error: 'Could not generate email: ' + e.message });
  }
});

// Send email to all users (broadcast)
app.post('/api/admin/email/broadcast', auth, adminOnly, async (req, res) => {
  const { subject, body, filter } = req.body || {};
  if (!subject || !body) return res.status(400).json({ error: 'Subject and body are required' });

  let recipients = db.users.filter(u => u && u.role !== 'admin' && u.email);

  // Apply filters
  if (filter === 'training_active') {
    const activeUserIds = new Set((db.enrollments || []).filter(e => e.status === 'active').map(e => e.userId));
    recipients = recipients.filter(u => activeUserIds.has(u.id));
  } else if (filter === 'training_installment') {
    const installmentUserIds = new Set((db.enrollments || [])
      .filter(e => e.paymentStatus === 'partial' && e.installmentCount > 1).map(e => e.userId));
    recipients = recipients.filter(u => installmentUserIds.has(u.id));
  } else if (filter === 'training_completed') {
    const completedUserIds = new Set((db.enrollments || []).filter(e => e.status === 'completed').map(e => e.userId));
    recipients = recipients.filter(u => completedUserIds.has(u.id));
  } else if (filter === 'no_orders') {
    const userIdsWithOrders = new Set((db.orders || []).map(o => o.userId));
    recipients = recipients.filter(u => !usersWithOrders.has(u.id));
  } else if (filter === 'all') {
    // all non-admin users (already filtered above)
  }

  if (recipients.length === 0) return res.status(400).json({ error: 'No recipients match this filter' });

  // Send emails
  const results = { sent: 0, failed: 0, emails: [] };
  for (const user of recipients) {
    // Personalize: replace {name} with user's name
    const personalizedBody = body.replace(/\{name\}/g, user.name).replace(/\{email\}/g, user.email);
    const personalizedSubject = subject.replace(/\{name\}/g, user.name);
    const mail = sendEmail(user.email, personalizedSubject, personalizedBody);
    results.emails.push({ userId: user.id, email: user.email, mailId: mail.id, status: mail.status });
    results.sent++;
  }

  // Log the broadcast
  logActivity('email_broadcast', `Email broadcast sent to ${recipients.length} users`,
    `Subject: "${subject}" | Filter: ${filter || 'all'} | Recipients: ${recipients.length}`);

  // Store broadcast record
  if (!db.emailBroadcasts) db.emailBroadcasts = [];
  db.emailBroadcasts.unshift({
    id: 'EB' + Date.now().toString(36).toUpperCase(),
    subject,
    body,
    filter: filter || 'all',
    recipientCount: recipients.length,
    sentBy: req.user.name,
    sentAt: new Date().toISOString(),
    recipientEmails: recipients.map(u => u.email)
  });
  if (db.emailBroadcasts.length > 100) db.emailBroadcasts = db.emailBroadcasts.slice(0, 100);
  save();

  res.json({ success: true, ...results });
});

// Send email to a single user
app.post('/api/admin/email/send-one', auth, adminOnly, (req, res) => {
  const { userId, subject, body } = req.body || {};
  if (!userId || !subject || !body) return res.status(400).json({ error: 'userId, subject, and body are required' });
  const user = db.users.find(u => u && u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const personalizedBody = body.replace(/\{name\}/g, user.name).replace(/\{email\}/g, user.email);
  const personalizedSubject = subject.replace(/\{name\}/g, user.name);
  const mail = sendEmail(user.email, personalizedSubject, personalizedBody);

  logActivity('email_single', `Email sent to ${user.email}`,
    `Subject: "${personalizedSubject}" | Sent by: ${req.user.name}`);

  res.json({ success: true, mailId: mail.id, status: mail.status, email: user.email });
});

// Get email broadcast history
app.get('/api/admin/email/history', auth, adminOnly, (req, res) => {
  const broadcasts = (db.emailBroadcasts || []).slice(0, 50);
  const recentEmails = (db.emails || []).slice(0, 50).map(e => ({
    id: e.id, to: e.to, subject: e.subject, status: e.status, at: e.at, sentAt: e.sentAt, error: e.error || null
  }));
  res.json({ broadcasts, recentEmails });
});

// ── Phase 9: Email notification settings + test endpoint ──
// Admin can view/update where notification emails are sent, and test
// whether email delivery (Resend) is actually working.
app.get('/api/admin/email/settings', auth, adminOnly, (req, res) => {
  const s = db.settings || {};
  res.json({
    adminEmail: s.adminEmail || 'admin@creatihub.com',
    notifyEmail: s.notifyEmail !== false,
    resendConfigured: !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 10),
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'CreatiHub <onboarding@resend.dev>'
  });
});

app.post('/api/admin/email/settings', auth, adminOnly, (req, res) => {
  const { adminEmail, notifyEmail } = req.body || {};
  if (!db.settings) db.settings = {};
  if (adminEmail && adminEmail.includes('@')) {
    db.settings.adminEmail = adminEmail.trim().toLowerCase();
  }
  if (typeof notifyEmail === 'boolean') {
    db.settings.notifyEmail = notifyEmail;
  }
  save();
  logActivity('settings', 'Updated email notification settings',
    `Admin email: ${db.settings.adminEmail} | Email notifications: ${db.settings.notifyEmail ? 'ON' : 'OFF'}`);
  res.json({ ok: true, settings: { adminEmail: db.settings.adminEmail, notifyEmail: db.settings.notifyEmail } });
});

// Test email — sends a test message to the admin email to verify Resend works
app.post('/api/admin/email/test', auth, adminOnly, async (req, res) => {
  const s = db.settings || {};
  const to = (req.body && req.body.to) || s.adminEmail || 'admin@creatihub.com';
  const mail = sendEmail(to, '[CreatiHub] ✅ Email test successful',
    `This is a test email from CreatiHub.\n\n` +
    `If you received this, email notifications are working correctly!\n\n` +
    `You will now receive email alerts for:\n` +
    `  • New support messages from customers\n` +
    `  • New orders and payments\n` +
    `  • Referral signups and bounty earnings\n` +
    `  • Password reset requests\n\n` +
    `Timestamp: ${new Date().toISOString()}\n` +
    `— CreatiHub`);
  res.json({
    ok: true,
    mailId: mail.id,
    status: mail.status,
    message: mail.status === 'logged_only'
      ? 'Email queued but NOT sent — Resend API key is not configured. Add RESEND_API_KEY to your Railway environment variables to enable real email delivery.'
      : mail.status === 'queued'
        ? 'Email queued and being sent via Resend. Check email history for delivery status.'
        : `Email status: ${mail.status}`
  });
});

// Get list of users for email targeting (with relevant info)
app.get('/api/admin/email/users', auth, adminOnly, (req, res) => {
  const users = db.users.filter(u => u && u.role !== 'admin').map(u => {
    const enrollments = (db.enrollments || []).filter(e => e.userId === u.id);
    const orders = (db.orders || []).filter(o => o.userId === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      country: u.country,
      createdAt: u.createdAt,
      hasTraining: enrollments.length > 0,
      activeTraining: enrollments.filter(e => e.status === 'active').length,
      completedTraining: enrollments.filter(e => e.status === 'completed').length,
      onInstallment: enrollments.some(e => e.paymentStatus === 'partial' && e.installmentCount > 1),
      orderCount: orders.length,
      lastActive: u.lastActive || u.createdAt
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ users });
});

// ---------------- Orders & Paystack Payments ----------------
// Step 1: create the order (status: awaiting_payment) + initialize a Paystack
// transaction. The frontend then opens the Paystack checkout (popup or redirect).
// Compute order add-ons + rush surcharge. Returns { addons, rushSurcharge, totalUsd, breakdown }
function computeOrderExtras(pkg, body) {
  const settings = db.settings || {};
  const rushCfg = settings.rushDelivery || { enabled: false };
  const addonCatalog = Array.isArray(settings.addons) ? settings.addons : [];

  // Rush delivery surcharge
  let rushSurcharge = 0;
  const rush = !!body.rushDelivery && rushCfg.enabled;
  if (rush) {
    const rate = typeof rushCfg.surchargeRate === 'number' ? rushCfg.surchargeRate : 0.35;
    const min = typeof rushCfg.minSurcharge === 'number' ? rushCfg.minSurcharge : 5;
    rushSurcharge = Math.max(pkg.price * rate, min);
  }

  // Selected add-ons (validate against catalog to prevent price tampering)
  const requested = Array.isArray(body.addons) ? body.addons : [];
  const byId = new Map(addonCatalog.map(a => [a.id, a]));
  const addons = requested
    .map(id => byId.get(id))
    .filter(Boolean)
    .map(a => ({ id: a.id, name: a.name, price: a.price }));

  const addonsTotal = addons.reduce((s, a) => s + a.price, 0);
  const basePrice = pkg.price;
  const totalUsd = Math.round((basePrice + rushSurcharge + addonsTotal) * 100) / 100;

  return { rush, rushSurcharge, addons, addonsTotal, basePrice, totalUsd };
}

app.post('/api/orders', auth, async (req, res) => {
  const { serviceId, packageId, requirements, couponCode, paymentMethod, cryptoWalletId } = req.body || {};
  const svc = db.services.find(s => s.id === serviceId);
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  const pkg = svc.packages.find(p => p.id === packageId);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });

  // Compute upsells (rush + add-ons) server-side so prices can't be tampered with
  const extras = computeOrderExtras(pkg, req.body);

  // Validate + apply coupon if one was provided
  let discountPct = 0;
  let appliedCoupon = null;
  if (couponCode && couponCode.trim()) {
    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = (db.coupons || []).find(c => c.code === cleanCode && c.active);
    if (!coupon) return res.status(400).json({ error: 'Invalid or expired coupon code' });
    if (coupon.maxUses && coupon.uses >= coupon.maxUses) return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.status(400).json({ error: 'This coupon has expired' });
    discountPct = coupon.discountPct;
    appliedCoupon = { id: coupon.id, code: coupon.code, discountPct: coupon.discountPct };
  }

  const subtotal = extras.totalUsd;
  const discountAmount = +(subtotal * discountPct / 100).toFixed(2);
  const finalTotal = +(subtotal - discountAmount).toFixed(2);

  const displayCurrency = req.user.currency || 'USD';
  const reference = 'CH' + Date.now().toString(36).toUpperCase() + uid('p').slice(2, 8).toUpperCase();

  // ── CRYPTO PAYMENT PATH ──────────────────────────────────────────────
  if (paymentMethod === 'crypto') {
    const wallet = (db.cryptoWallets || []).find(w => w.id === cryptoWalletId && w.active);
    if (!wallet) return res.status(400).json({ error: 'Selected crypto wallet is not available. Please choose another payment method.' });

    // Convert USD total to crypto amount (using cached/fallback prices)
    const cryptoAmt = cryptoPay.usdToCryptoSync(finalTotal, wallet.symbol);
    if (cryptoAmt.error) return res.status(400).json({ error: cryptoAmt.error });

    const order = {
      id: 'CH-' + (db.orderCounter++),
      userId: req.user.id, userName: req.user.name, userEmail: req.user.email,
      serviceId: svc.id, serviceName: svc.name,
      packageId: pkg.id, packageName: pkg.name,
      price: finalTotal,
      basePrice: extras.basePrice,
      originalTotal: subtotal,
      discountPct, discountAmount,
      coupon: appliedCoupon,
      currency: 'USD',
      rushDelivery: extras.rush,
      rushSurcharge: extras.rushSurcharge,
      addons: extras.addons,
      addonsTotal: extras.addonsTotal,
      status: 'awaiting_payment',
      requirements: requirements || '',
      paymentMethod: 'crypto',
      paymentReference: reference,
      paymentStatus: 'unpaid',
      // Crypto-specific fields
      cryptoWalletId: wallet.id,
      cryptoSymbol: wallet.symbol,
      cryptoChain: wallet.chain,
      cryptoAddress: wallet.address,
      cryptoAmount: cryptoAmt.amount,
      cryptoPricePerUnit: cryptoAmt.pricePerUnit,
      cryptoDecimals: cryptoAmt.decimals,
      cryptoConfirmed: false,
      cryptoConfirmedAt: null,
      cryptoConfirmedBy: null,
      cryptoTxHash: null,
      revisions: [],
      rating: null, review: null,
      createdAt: new Date().toISOString(),
      timeline: [{ status: 'awaiting_payment', at: new Date().toISOString(), note: `Order created — awaiting crypto payment (${cryptoAmt.amount} ${wallet.symbol} to ${wallet.address})${appliedCoupon ? ` (${appliedCoupon.code}: ${discountPct}% off = -$${discountAmount})` : ''}` }]
    };

    db.orders.push(order);
    save();
    logActivity('order', `New order ${order.id} (awaiting crypto payment)`,
      `${req.user.name} ordered ${svc.name} (${pkg.name}) — $${extras.totalUsd}${extras.rush ? ' [RUSH]' : ''}${extras.addons.length ? ' + addons' : ''} — crypto: ${cryptoAmt.amount} ${wallet.symbol} (${wallet.chain})`);

    // Notify admin of pending crypto payment
    notify('order', `🪙 Crypto order awaiting payment — ${order.id}`,
      `${req.user.name} (${req.user.email}) chose crypto payment:\n\n• Service: ${svc.name} (${pkg.name})\n• Amount: $${finalTotal} = ${cryptoAmt.amount} ${wallet.symbol} (${wallet.chain})\n• Wallet: ${wallet.address}\n• Reference: ${reference}\n\nThe customer will click "I've Paid" after sending. You must verify the transaction on-chain and confirm it from the admin dashboard.`);

    res.json({
      order,
      payment: {
        method: 'crypto',
        reference,
        symbol: wallet.symbol,
        chain: wallet.chain,
        address: wallet.address,
        label: wallet.label,
        icon: (cryptoPay.COINS[wallet.symbol] || {}).icon || '•',
        cryptoAmount: cryptoAmt.amount,
        usdAmount: finalTotal,
        pricePerUnit: cryptoAmt.pricePerUnit,
        decimals: cryptoAmt.decimals,
        qrUrl: cryptoPay.qrUrl(wallet.symbol, wallet.address, cryptoAmt.amount, wallet.chain),
        note: `Send exactly ${cryptoAmt.amount} ${wallet.symbol} (${wallet.chain}) to the address above, then click "I've Paid". An admin will verify your payment on the blockchain.`,
      }
    });
    return;
  }

  // ── PAYSTACK PAYMENT PATH (default) ──────────────────────────────────
  const charge = paystack.toChargeAmount(finalTotal, displayCurrency, CURRENCY_RATES);

  const order = {
    id: 'CH-' + (db.orderCounter++),
    userId: req.user.id, userName: req.user.name, userEmail: req.user.email,
    serviceId: svc.id, serviceName: svc.name,
    packageId: pkg.id, packageName: pkg.name,
    price: finalTotal,                      // total charged (after coupon + upsells)
    basePrice: extras.basePrice,            // package base price (for analytics)
    originalTotal: subtotal,                // pre-discount total (for analytics)
    discountPct, discountAmount,
    coupon: appliedCoupon,
    currency: 'USD',
    rushDelivery: extras.rush,
    rushSurcharge: extras.rushSurcharge,
    addons: extras.addons,                  // [{id,name,price}]
    addonsTotal: extras.addonsTotal,
    status: 'awaiting_payment',
    requirements: requirements || '',
    paymentMethod: 'paystack',
    paymentReference: reference,
    paymentStatus: 'unpaid',
    chargeCurrency: charge.currency,
    chargeAmount: charge.amount,
    revisions: [],
    rating: null, review: null,
    createdAt: new Date().toISOString(),
    timeline: [{ status: 'awaiting_payment', at: new Date().toISOString(), note: `Order created — awaiting Paystack payment${appliedCoupon ? ` (${appliedCoupon.code}: ${discountPct}% off = -$${discountAmount})` : ''}` }]
  };

  const baseUrl = process.env.PAYSTACK_CALLBACK_URL ||
    (req.protocol + '://' + req.get('host') + '/payment/callback');

  try {
    const init = await paystack.initializeTransaction({
      email: req.user.email,
      amount: charge.amount,
      currency: charge.currency,
      reference,
      callbackUrl: baseUrl,
      metadata: {
        order_id: order.id,
        service: svc.name,
        package: pkg.name,
        customer_name: req.user.name,
        custom_fields: [
          { display_name: 'Order ID', variable_name: 'order_id', value: order.id },
          { display_name: 'Service', variable_name: 'service', value: svc.name },
          { display_name: 'Rush', variable_name: 'rush', value: extras.rush ? 'Yes (+' + extras.rushSurcharge + ' USD)' : 'No' },
          { display_name: 'Add-ons', variable_name: 'addons', value: extras.addons.map(a => a.name).join(', ') || 'None' }
        ]
      }
    });

    order.paymentAccessCode = init.data.access_code;
    db.orders.push(order);
    save();
    logActivity('order', `New order ${order.id} (awaiting payment)`,
      `${req.user.name} ordered ${svc.name} (${pkg.name}) — $${extras.totalUsd}${extras.rush ? ' [RUSH]' : ''}${extras.addons.length ? ' + addons' : ''} — ref ${reference}`);

    res.json({
      order,
      payment: {
        reference,
        accessCode: init.data.access_code,
        authorizationUrl: init.data.authorization_url,
        amount: charge.amount,
        currency: charge.currency,
        publicKey: paystack.publicKey(),
        demo: paystack.isDemo()
      }
    });
  } catch (e) {
    res.status(502).json({ error: 'Could not initialize payment: ' + e.message });
  }
});

// Step 2: verify payment after the customer returns from Paystack.
// Called by the payment callback page (and as a fallback from the popup flow).
app.get('/api/payments/verify/:reference', auth, async (req, res) => {
  // First check if this is a training installment payment
  const trainingEnrollment = (db.enrollments || []).find(e =>
    e.payments && e.payments.some(p => p.reference === req.params.reference)
  );
  if (trainingEnrollment) {
    const payment = trainingEnrollment.payments.find(p => p.reference === req.params.reference);
    if (payment && payment.status === 'paid') return res.json({ enrollment: trainingEnrollment, alreadyPaid: true });
    if (trainingEnrollment.userId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'This payment belongs to another account' });
    try {
      const v = await paystack.verifyTransaction(req.params.reference);
      if (v.paid) {
        payment.status = 'paid';
        payment.paidAt = v.paidAt || new Date().toISOString();
        trainingEnrollment.paymentsMade = (trainingEnrollment.paymentsMade || 0) + 1;
        const program = (db.trainingPrograms || []).find(p => p.id === trainingEnrollment.programId);
        unlockTrainingModules(trainingEnrollment, program);
        const tier = program && program.tiers ? program.tiers.find(t => t.id === trainingEnrollment.tierId) : null;
        const instPlan = tier && tier.installments ? tier.installments.find(i => i.id === trainingEnrollment.installmentPlanId) : null;
        if (instPlan && trainingEnrollment.paymentsMade < trainingEnrollment.installmentCount) {
          trainingEnrollment.nextPaymentDue = computeNextInstallmentDate(instPlan, program.durationWeeks, trainingEnrollment.paymentsMade);
        }
        trainingEnrollment.timeline.push({ status: 'payment', at: new Date().toISOString(), note: `Installment ${payment.installmentNumber} of ${trainingEnrollment.installmentCount} paid ($${payment.amount})` });
        save();
        return res.json({ enrollment: trainingEnrollment, paid: true });
      }
      return res.status(402).json({ error: 'Payment not completed', status: v.status });
    } catch (e) {
      console.error('[PAYMENT VERIFY ERROR] training installment', { reference: req.params.reference, enrollmentId: trainingEnrollment.id, error: e.message });
      return res.status(502).json({ error: 'Could not verify payment: ' + e.message });
    }
  }

  // Standard order verification
  const order = db.orders.find(o => o.paymentReference === req.params.reference);
  if (!order) return res.status(404).json({ error: 'Order not found for this reference' });
  if (order.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'This payment belongs to another account' });
  }
  if (order.paymentStatus === 'paid') return res.json({ order, alreadyPaid: true });

  try {
    const v = await paystack.verifyTransaction(order.paymentReference);
    if (v.paid) {
      await markOrderPaid(order, { channel: v.channel, paidAt: v.paidAt, amount: v.amount, currency: v.currency });
      return res.json({ order, paid: true });
    }
    order.timeline.push({ status: 'awaiting_payment', at: new Date().toISOString(), note: 'Payment not completed (status: ' + v.status + ')' });
    save();
    res.status(402).json({ error: 'Payment not completed', status: v.status, order });
  } catch (e) {
    console.error('[PAYMENT VERIFY ERROR] order', { reference: req.params.reference, orderId: order.id, error: e.message });
    res.status(502).json({ error: 'Could not verify payment: ' + e.message });
  }
});

// Let a logged-in user re-try payment for an unpaid order
app.post('/api/orders/:id/repay', auth, async (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.paymentStatus === 'paid') return res.status(400).json({ error: 'This order is already paid' });

  const charge = paystack.toChargeAmount(order.price, req.user.currency || 'USD', CURRENCY_RATES);
  const reference = 'CH' + Date.now().toString(36).toUpperCase() + uid('p').slice(2, 8).toUpperCase();
  const baseUrl = process.env.PAYSTACK_CALLBACK_URL ||
    (req.protocol + '://' + req.get('host') + '/payment/callback');

  try {
    const init = await paystack.initializeTransaction({
      email: req.user.email, amount: charge.amount, currency: charge.currency,
      reference, callbackUrl: baseUrl,
      metadata: { order_id: order.id, service: order.serviceName, package: order.packageName, retry: true }
    });
    order.paymentReference = reference;
    order.paymentAccessCode = init.data.access_code;
    order.chargeCurrency = charge.currency;
    order.chargeAmount = charge.amount;
    order.timeline.push({ status: 'awaiting_payment', at: new Date().toISOString(), note: 'Payment retried — new reference ' + reference });
    save();
    res.json({
      order,
      payment: {
        reference, accessCode: init.data.access_code, authorizationUrl: init.data.authorization_url,
        amount: charge.amount, currency: charge.currency, publicKey: paystack.publicKey(), demo: paystack.isDemo()
      }
    });
  } catch (e) {
    res.status(502).json({ error: 'Could not initialize payment: ' + e.message });
  }
});

// ── CRYPTO: Customer marks "I've Paid" ──────────────────────────────────
// The customer clicks this after sending crypto to the wallet address.
// It flags the order for admin verification (does NOT auto-confirm).
app.post('/api/orders/:id/crypto-paid', auth, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.paymentMethod !== 'crypto') return res.status(400).json({ error: 'This order is not a crypto payment order' });
  if (order.paymentStatus === 'paid') return res.status(400).json({ error: 'This order is already paid' });

  const { txHash } = req.body || {};
  order.cryptoCustomerPaidAt = new Date().toISOString();
  order.cryptoCustomerPaid = true;
  if (txHash && txHash.trim()) order.cryptoTxHash = txHash.trim();
  order.timeline.push({
    status: 'awaiting_payment',
    at: new Date().toISOString(),
    note: `Customer marked crypto payment as sent${txHash ? ' (TX: ' + txHash.trim() + ')' : ''}. Awaiting admin verification.`
  });
  save();

  // Notify admin that a customer claims to have paid
  notify('order', `🪙 Crypto payment claim — ${order.id}`,
    `${order.userName} (${order.userEmail}) reports they've sent ${order.cryptoAmount} ${order.cryptoSymbol} (${order.cryptoChain}) for order ${order.id}.\n\n• Amount: $${order.price} = ${order.cryptoAmount} ${order.cryptoSymbol}\n• Wallet: ${order.cryptoAddress}\n• TX Hash: ${txHash || 'not provided'}\n\nPlease verify on the blockchain and confirm this payment from the admin dashboard.`);

  logActivity('order', `Crypto payment claim for ${order.id}`,
    `${order.userName} marked crypto payment as sent (${order.cryptoAmount} ${order.cryptoSymbol})${txHash ? ' TX: ' + txHash : ''}`);

  res.json({
    success: true,
    message: 'Thank you! We\'ve notified the admin. Your payment will be verified on the blockchain and your order will be processed once confirmed.',
    order,
  });
});

// ── CRYPTO: Customer gets payment details for an existing order ─────────
app.get('/api/orders/:id/crypto-details', auth, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id && (o.userId === req.user.id || req.user.role === 'admin'));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.paymentMethod !== 'crypto') return res.status(400).json({ error: 'This order is not a crypto payment order' });

  // Re-fetch current wallet address (in case admin updated it)
  const wallet = (db.cryptoWallets || []).find(w => w.id === order.cryptoWalletId);
  const address = (wallet && wallet.address) || order.cryptoAddress;

  res.json({
    orderId: order.id,
    symbol: order.cryptoSymbol,
    chain: order.cryptoChain,
    address,
    cryptoAmount: order.cryptoAmount,
    usdAmount: order.price,
    pricePerUnit: order.cryptoPricePerUnit,
    decimals: order.cryptoDecimals,
    qrUrl: cryptoPay.qrUrl(order.cryptoSymbol, address, order.cryptoAmount, order.cryptoChain),
    paymentStatus: order.paymentStatus,
    cryptoCustomerPaid: order.cryptoCustomerPaid || false,
    cryptoConfirmed: order.cryptoConfirmed || false,
    icon: (cryptoPay.COINS[order.cryptoSymbol] || {}).icon || '•',
    note: `Send exactly ${order.cryptoAmount} ${order.cryptoSymbol} (${order.cryptoChain}) to ${address}, then click "I've Paid".`,
  });
});

app.get('/api/orders', auth, (req, res) => {
  const orders = db.orders.filter(o => o.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders });
});

app.get('/api/orders/:id', auth, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id && (o.userId === req.user.id || req.user.role === 'admin'));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

// ===================================================================
// SUBSCRIPTIONS (recurring monthly retainers via Paystack Plans)
// ===================================================================

// List the current user's subscriptions (admin sees all)
app.get('/api/subscriptions', auth, (req, res) => {
  const subs = req.user.role === 'admin'
    ? db.subscriptions
    : db.subscriptions.filter(s => s.userId === req.user.id);
  res.json({ subscriptions: subs });
});

// Start a new subscription. Creates (or reuses) a Paystack Plan for the
// chosen retainer tier, initializes a subscription transaction, and stores
// a pending subscription record keyed by reference.
app.post('/api/subscriptions', auth, async (req, res) => {
  const { planId } = req.body || {};
  const plan = (db.settings.subscriptionPlans || []).find(p => p.id === planId);
  if (!plan) return res.status(404).json({ error: 'Subscription plan not found' });

  const displayCurrency = req.user.currency || 'USD';
  const charge = paystack.toChargeAmount(plan.price, displayCurrency, CURRENCY_RATES);
  const reference = 'SUB' + Date.now().toString(36).toUpperCase() + uid('s').slice(2, 8).toUpperCase();

  // Ensure a Paystack Plan exists for this tier. We cache the plan_code on the
  // plan definition so we only create it once per tier.
  let planCode = plan.paystackPlanCode;
  if (!planCode) {
    try {
      const created = await paystack.createPlan({
        name: 'CreatiHub — ' + plan.name,
        amount: charge.amount,
        currency: charge.currency,
        interval: plan.interval || 'monthly',
        description: plan.desc || plan.tagline || ''
      });
      if (created && created.data && created.data.plan_code) {
        planCode = created.data.plan_code;
        plan.paystackPlanCode = planCode;   // cache for reuse
        save();
      }
    } catch (e) {
      return res.status(502).json({ error: 'Could not create subscription plan: ' + e.message });
    }
  }

  const baseUrl = process.env.PAYSTACK_CALLBACK_URL ||
    (req.protocol + '://' + req.get('host') + '/payment/callback');

  const sub = {
    id: 'SUB-' + (db.orderCounter++),
    userId: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    planId: plan.id,
    planName: plan.name,
    planPrice: plan.price,            // USD/month (authoritative)
    interval: plan.interval || 'monthly',
    status: 'pending',                // pending -> active (on webhook/verify) -> cancelled
    reference,
    subscriptionCode: null,           // filled by Paystack webhook (subscription.create)
    chargeCurrency: charge.currency,
    chargeAmount: charge.amount,
    startedAt: new Date().toISOString(),
    activatedAt: null,
    currentPeriodEnd: null,
    lastChargeAt: null,
    lastChargeReference: null,
    cancelledAt: null
  };

  try {
    const init = await paystack.initializeSubscription({
      email: req.user.email,
      planCode,
      reference,
      callbackUrl: baseUrl + '?subscription=1',
      metadata: {
        subscription_id: sub.id,
        plan: plan.name,
        customer_name: req.user.name,
        custom_fields: [
          { display_name: 'Subscription', variable_name: 'sub_id', value: sub.id },
          { display_name: 'Plan', variable_name: 'plan', value: plan.name }
        ]
      }
    });

    db.subscriptions.push(sub);
    save();
    logActivity('order', `New subscription ${sub.id} (pending)`,
      `${req.user.name} subscribed to ${plan.name} — $${plan.price}/mo — ref ${reference}`);

    res.json({
      subscription: sub,
      payment: {
        reference,
        accessCode: init.data.access_code,
        authorizationUrl: init.data.authorization_url,
        publicKey: paystack.publicKey(),
        demo: paystack.isDemo()
      }
    });
  } catch (e) {
    res.status(502).json({ error: 'Could not initialize subscription payment: ' + e.message });
  }
});

// Verify a subscription payment after the customer returns from Paystack
// (mirrors the one-off order verify flow).
app.get('/api/subscriptions/verify/:reference', auth, async (req, res) => {
  const sub = db.subscriptions.find(s => s.reference === req.params.reference);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  if (sub.userId !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  if (sub.status === 'active') return res.json({ subscription: sub, active: true });

  try {
    const v = await paystack.verifyTransaction(sub.reference);
    if (v.paid) {
      sub.status = 'active';
      sub.activatedAt = new Date().toISOString();
      const next = new Date(); next.setMonth(next.getMonth() + 1);
      sub.currentPeriodEnd = next.toISOString();
      sub.lastChargeAt = v.paidAt || new Date().toISOString();
      save();
      logActivity('payment', `Subscription active: ${sub.planName}`,
        `${sub.userName}'s subscription ${sub.id} is now active — ref ${sub.reference}`);
      return res.json({ subscription: sub, active: true });
    }
    res.status(402).json({ error: 'Subscription payment not completed', status: v.status, subscription: sub });
  } catch (e) {
    res.status(502).json({ error: 'Could not verify subscription: ' + e.message });
  }
});

// Cancel a subscription (user cancels their own; admin can cancel any)
app.post('/api/subscriptions/:id/cancel', auth, (req, res) => {
  const sub = db.subscriptions.find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  if (sub.userId !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });
  if (sub.status === 'cancelled') return res.json({ subscription: sub });

  sub.status = 'cancelled';
  sub.cancelledAt = new Date().toISOString();
  save();
  logActivity('order', `Subscription cancelled: ${sub.planName}`,
    `${sub.userName} cancelled subscription ${sub.id}`);
  // NOTE: In live Paystack mode you'd also call Paystack's /subscription/:code/disable
  // endpoint here. In demo mode we just mark it locally.
  res.json({ subscription: sub });
});

// Admin: list all subscriptions (summary for the admin dashboard)
app.get('/api/admin/subscriptions', auth, adminOnly, (req, res) => {
  const active = db.subscriptions.filter(s => s.status === 'active');
  const monthlyRevenue = active.reduce((sum, s) => sum + (s.planPrice || 0), 0);
  res.json({
    subscriptions: db.subscriptions,
    stats: {
      total: db.subscriptions.length,
      active: active.length,
      cancelled: db.subscriptions.filter(s => s.status === 'cancelled').length,
      pending: db.subscriptions.filter(s => s.status === 'pending').length,
      monthlyRecurringRevenue: Math.round(monthlyRevenue * 100) / 100
    }
  });
});

// ---------------- AI Chat (users) ----------------
app.post('/api/chat', (req, res) => {
  let result;
  let aiError = null;
  const { message } = req.body || {};
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });
  // Optional auth — chat works for guests too
  const token = req.headers['x-token'];
  const userId = token && db.tokens[token];
  const user = userId ? db.users.find(u => u && u.id === userId) : null;

  // ── Run the AI assistant (may throw — we still notify admin either way) ──
  try {
    // safeUserAssistant applies the safety filter, runs the assistant, and logs
    // the AI task to the live admin activity feed automatically.
    result = safeUserAssistant(message, user);
  } catch (err) {
    console.error('Chat error (AI assistant failed):', err.message);
    aiError = err.message;
    result = {
      reply: "I'm here to help! I can assist you with finding services, checking prices, tracking orders, and more. What would you like to create today?",
      suggestions: ['Show me all services', 'I need a flyer', 'How much is a video?', 'Track my order']
    };
  }

  // ── Save the chat exchange to history ──
  try {
    db.chats.push({ id: uid('c'), userId: user ? user.id : 'guest', role: 'user', message, at: new Date().toISOString() });
    db.chats.push({ id: uid('c'), userId: user ? user.id : 'guest', role: 'assistant', message: result.reply, at: new Date().toISOString() });
    save();
  } catch (e) { console.error('[chat] save error:', e.message); }

  // ── Phase 9: ALWAYS notify admin (dashboard + email) on every support message ──
  // This fires regardless of whether the AI succeeded or failed, so the admin
  // never misses a customer message. Blocked messages are excluded (already
  // logged to the safety audit trail by the filter).
  if (!result.blocked) {
    const who = user ? `${user.name} (${user.email})` : 'A guest visitor';
    const ts = new Date().toISOString();
    try {
      logActivity('chat', 'Nova handling support chat', `${who}: "${message.slice(0, 120)}"`);
    } catch (e) { /* non-critical */ }

    const emailSubject = aiError
      ? '💬 Support message — AI assistant failed (needs your attention)'
      : '💬 New support message from ' + (user ? user.name : 'a visitor');

    const emailBody = aiError
      ? `${who} sent a message to customer support, but Nova (the AI assistant) encountered an error and could not respond properly.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `CUSTOMER MESSAGE:\n"${message}"\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `AI Error: ${aiError}\n\n` +
        `⚠️  This customer is waiting — please respond manually from the admin dashboard.\n\n` +
        `Timestamp: ${ts}\n` +
        `— CreatiHub Support`
      : `${who} sent a message to customer support:\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `CUSTOMER MESSAGE:\n"${message}"\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Nova replied instantly:\n"${String(result.reply).slice(0, 200)}"\n\n` +
        `Open the admin dashboard to review the full conversation.\n\n` +
        `Timestamp: ${ts}\n` +
        `— CreatiHub Support`;

    notify('support', emailSubject, emailBody);
  }

  res.json(result);
});

// ---------------- Admin routes ----------------
app.get('/api/admin/stats', auth, adminOnly, (req, res) => {
  const orders = db.orders;
  const isPaid = o => o.paymentStatus === 'paid' && o.status !== 'cancelled';
  const revenue = orders.filter(isPaid).reduce((s, o) => s + o.price, 0);
  const byStatus = { awaiting_payment: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
  orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
  const byService = {};
  orders.forEach(o => {
    if (!byService[o.serviceName]) byService[o.serviceName] = { orders: 0, revenue: 0 };
    byService[o.serviceName].orders++;
    if (isPaid(o)) byService[o.serviceName].revenue += o.price;
  });
  // Revenue by day (last 7 days)
  const byDay = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  orders.filter(isPaid).forEach(o => {
    const day = o.createdAt.slice(0, 10);
    if (day in byDay) byDay[day] += o.price;
  });
  res.json({
    revenue, totalOrders: orders.length, byStatus, byService, byDay,
    unpaidOrders: orders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled').length,
    customers: db.users.filter(u => u && u.role !== 'admin').length,
    services: db.services.length,
    chats: db.chats.length
  });
});

app.get('/api/admin/orders', auth, adminOnly, (req, res) => {
  const orders = [...db.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders });
});

app.put('/api/admin/orders/:id', auth, adminOnly, async (req, res) => {
  const { status, note } = req.body || {};
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (order.paymentStatus !== 'paid' && status !== 'cancelled') {
    return res.status(400).json({ error: 'This order has not been paid yet. Only cancel unpaid orders.' });
  }
  order.status = status;
  order.timeline.push({ status, at: new Date().toISOString(), note: note || 'Status updated by admin' });
  // Note: AI generation now happens automatically the moment payment is
  // confirmed (see markOrderPaid → autoGenerateDeliverables). Admins can
  // still regenerate deliverables manually via POST /api/admin/orders/:id/generate.
  save();
  res.json({ order });
});

// ===================================================================
// AI GENERATION — admin manually (re)generates deliverables for an order
// ===================================================================
app.post('/api/admin/orders/:id/generate', auth, adminOnly, async (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  try {
    const { generate, modeLabel, canAutoFulfill } = require('./generator');
    const result = await generate(order);
    if (!Array.isArray(order.deliverables)) order.deliverables = [];
    order.deliverables.push({ runId: Date.now(), mode: result.mode, items: result.deliverables, at: new Date().toISOString() });
    order.timeline.push({ status: order.status, at: new Date().toISOString(), note: `Deliverables regenerated by admin (${result.mode} mode): ${result.deliverables.length} file(s)` });
    save();
    logAiActivity('order', req.user.email, 'regenerated deliverables', `${order.id} — ${order.serviceName} — ${result.mode} mode`);
    res.json({ order, mode: result.mode, count: result.deliverables.length, generatorMode: modeLabel() });
  } catch (err) {
    console.error('[generate] error for', order.id, err);
    // If the generator signalled manual fulfillment is required, inform the admin
    if (err.code === 'MANUAL_FULFILLMENT_REQUIRED') {
      order.fulfillmentMode = 'manual';
      order.manualReason = err.message.replace(/^IMAGE_MANUAL_FULFILLMENT_REQUIRED:\s*/, '');
      order.timeline.push({ status: order.status, at: new Date().toISOString(), note: 'AI image generation quota exhausted — use "Upload Deliverable" to add the finished work manually.' });
      save();
      return res.status(422).json({ error: 'This order needs manual fulfillment — the free AI keys cannot generate it. Use the "Upload Deliverable" button to add the finished file(s).', manualRequired: true });
    }
    res.status(500).json({ error: 'Generation failed: ' + err.message });
  }
});

// ===================================================================
// ADMIN UPLOAD — admin manually uploads a finished deliverable to an order
// (Phase 6: Tiered Fulfillment). Used for orders the free-tier AI keys
// cannot auto-generate (e.g. image services). The admin creates the work
// themselves and uploads it here; the customer is then notified and can
// download from their dashboard.
// ===================================================================
app.post('/api/admin/orders/:id/upload', auth, adminOnly, async (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const { filename, mime, content, kind, summary } = req.body || {};
  if (!filename || !content) {
    return res.status(400).json({ error: 'filename and content (base64) are required' });
  }
  // Validate base64
  const isBase64 = /^data:.*;base64,/.test(content) || /^[A-Za-z0-9+/\n\r]+=*$/.test(content.replace(/\s/g, ''));
  if (!isBase64) {
    return res.status(400).json({ error: 'content must be a base64-encoded string (optionally data-URI prefixed)' });
  }
  // Strip data-URI prefix if present
  const cleanBase64 = content.replace(/^data:[^;]+;base64,/, '');
  // Detect kind from mime if not provided
  let detectedKind = kind || 'file';
  if (!kind) {
    const m = (mime || '').toLowerCase();
    if (m.startsWith('image/')) detectedKind = 'image';
    else if (m.startsWith('audio/')) detectedKind = 'audio';
    else if (m.startsWith('video/')) detectedKind = 'video';
    else if (m.includes('pdf') || m.includes('document') || m.includes('zip') || m.includes('octet')) detectedKind = 'file';
    else detectedKind = 'text';
  }
  const crypto = require('crypto');
  const fileObj = {
    id: 'del_' + crypto.randomBytes(5).toString('hex'),
    kind: detectedKind,
    filename: filename.trim(),
    mime: mime || 'application/octet-stream',
    content: cleanBase64,
    encoding: 'base64',
    isDemo: false,
    summary: summary || `Manually uploaded by admin (${req.user.email})`,
    provider: 'admin-manual',
    uploadedBy: req.user.email,
    generatedAt: new Date().toISOString()
  };
  if (!Array.isArray(order.deliverables)) order.deliverables = [];
  // Add as a new deliverable run (so it appears alongside any AI runs)
  order.deliverables.push({
    runId: Date.now(),
    mode: 'manual',
    items: [fileObj],
    at: new Date().toISOString(),
    uploadedBy: req.user.email
  });
  // Mark the order as completed (the work is delivered) and record timeline
  const wasCompleted = order.status === 'completed';
  order.status = 'completed';
  order.fulfillmentMode = order.fulfillmentMode || 'manual';
  order.timeline.push({
    status: 'completed',
    at: new Date().toISOString(),
    note: `Deliverable uploaded manually by admin (${req.user.email}): ${filename}. Order marked complete.`
  });
  save();
  logAiActivity('order', req.user.email, 'uploaded deliverable manually', `${order.id} — ${order.serviceName} — ${filename}`);
  // Notify admin
  notify('order', `📤 Deliverable uploaded — ${order.id}`,
    `You uploaded a deliverable for ${order.serviceName}.\n\n• File: ${filename}\n• Order: ${order.id}\n• Customer: ${order.userName} (${order.userEmail})\n\nThe customer has been notified and can download it from their dashboard.`);
  // Notify the customer via email
  if (order.userEmail) {
    sendEmail(order.userEmail, `[CreatiHub] Your order ${order.id} is ready! 🎉`,
      `Hi ${order.userName || 'there'},\n\nGreat news! Your deliverable for "${order.serviceName}" is ready.\n\n• Order: ${order.id}\n• File: ${filename}\n• Service: ${order.serviceName} (${order.packageName})\n\nYou can download it now from your dashboard:\n${getBaseUrl()}/dashboard\n\nIf you'd like any changes, you can request a revision directly from your order page.\n\nThank you for choosing CreatiHub!\n\n— The CreatiHub Team`);
  }
  res.json({ order, file: { id: fileObj.id, filename: fileObj.filename, kind: fileObj.kind, mime: fileObj.mime } });
});

// ===================================================================
// DELIVERABLES — customer fetches the files for their paid order
// ===================================================================
app.get('/api/orders/:id/deliverables', auth, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id && (o.userId === req.user.id || req.user.role === 'admin'));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ deliverables: order.deliverables || [], order: { id: order.id, status: order.status, serviceName: order.serviceName } });
});

// Download a single deliverable file (admin or order owner).
app.get('/api/orders/:id/deliverables/:runId/:fileId', auth, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id && (o.userId === req.user.id || req.user.role === 'admin'));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const run = (order.deliverables || []).find(r => String(r.runId) === String(req.params.runId));
  if (!run) return res.status(404).json({ error: 'Generation run not found' });
  const file = (run.items || []).find(f => f.id === req.params.fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });
  res.setHeader('Content-Type', file.mime || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  if (file.encoding === 'base64') {
    res.send(Buffer.from(file.content, 'base64'));
  } else {
    res.send(file.content);
  }
});

// ===================================================================
// ORDER REVISION REQUESTS — customer asks for changes after delivery
// ===================================================================

// Customer submits a revision request for a delivered order
app.post('/api/orders/:id/revisions', auth, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.paymentStatus !== 'paid') return res.status(400).json({ error: 'Only paid orders can have revisions' });
  const message = (req.body.message || req.body.note || '').trim();
  if (!message) return res.status(400).json({ error: 'Please describe what you would like changed' });
  if (!Array.isArray(order.revisions)) order.revisions = [];
  const rev = {
    id: uid('rev'),
    note: message,
    status: 'pending',        // pending | accepted | rejected | completed
    requestedAt: new Date().toISOString(),
    at: new Date().toISOString(),
    response: null,
    respondedAt: null
  };
  order.revisions.push(rev);
  order.timeline.push({ status: order.status, at: new Date().toISOString(), note: `Revision request #${order.revisions.length}: ${message.slice(0, 80)}` });
  save();
  notify('order', `🔄 Revision requested — ${order.id}`,
    `${order.userName} requested a revision:\n\n"${message}"\n\nReview it in the admin Orders panel.`);
  logActivity('order', `Revision request for ${order.id}`, `${order.userName} asked for changes: ${message.slice(0, 100)}`);
  res.json({ order, revision: rev });
});

// Admin responds to a revision request (accept → re-generate, or reject)
app.put('/api/admin/orders/:id/revisions/:revId', auth, adminOnly, async (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const rev = (order.revisions || []).find(r => r.id === req.params.revId);
  if (!rev) return res.status(404).json({ error: 'Revision request not found' });
  const { status, response, regenerate } = req.body || {};
  if (!['accepted', 'rejected', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use: accepted, rejected, or completed' });
  }
  rev.status = status;
  rev.response = (response || '').trim();
  rev.respondedAt = new Date().toISOString();
  order.timeline.push({ status: order.status, at: new Date().toISOString(), note: `Revision ${rev.id} ${status} by admin${rev.response ? ': ' + rev.response.slice(0, 80) : ''}` });
  // If accepted and regenerate is true, re-run the AI generation engine
  if (status === 'accepted' && regenerate !== false) {
    try {
      const { generate } = require('./generator');
      const result = await generate(order);
      if (!Array.isArray(order.deliverables)) order.deliverables = [];
      order.deliverables.push({ runId: Date.now(), mode: result.mode, items: result.deliverables, at: new Date().toISOString() });
      rev.status = 'completed';
      order.timeline.push({ status: order.status, at: new Date().toISOString(), note: `Deliverables re-generated for revision (${result.mode} mode): ${result.deliverables.length} file(s)` });
      logAiActivity('order', req.user.email, 're-generated for revision', `${order.id} — ${order.serviceName} — ${result.mode} mode`);
      // Notify customer that their revision is ready
      sendEmail(order.userEmail, `[CreatiHub] Your revision is ready — ${order.id}`,
        `Hi ${order.userName},\n\nYour revision request has been completed. New deliverables are available in your dashboard.\n\nRevision notes: ${rev.response || 'N/A'}\n\nLog in to download your updated files.`);
    } catch (err) {
      console.error('[revision] re-generation failed for', order.id, err.message);
      order.timeline.push({ status: order.status, at: new Date().toISOString(), note: `Revision re-generation failed: ${err.message}` });
    }
  }
  save();
  res.json({ order, revision: rev });
});

// ===================================================================
// SERVICE RATINGS & REVIEWS — customers rate completed orders
// ===================================================================

// Customer submits a rating + review for a completed order
app.post('/api/orders/:id/review', auth, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.paymentStatus !== 'paid') return res.status(400).json({ error: 'Only paid orders can be reviewed' });
  if (order.rating) return res.status(400).json({ error: 'You have already reviewed this order' });
  const { rating, review } = req.body || {};
  const stars = parseInt(rating, 10);
  if (!stars || stars < 1 || stars > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  order.rating = stars;
  order.review = (review || '').trim();
  order.reviewedAt = new Date().toISOString();
  order.timeline.push({ status: order.status, at: new Date().toISOString(), note: `Customer rated ${stars}★${order.review ? ' and left a review' : ''}` });
  save();
  logActivity('order', `Review submitted for ${order.id}`, `${order.userName} rated ${order.serviceName} ${stars}★`);
  notify('order', `⭐ New ${stars}★ review — ${order.serviceName}`,
    `${order.userName} rated their order ${stars}/5${order.review ? ':\n\n"' + order.review + '"' : ''}\n\nSee all reviews in the admin panel.`);
  res.json({ order });
});

// Public endpoint: get all reviews for a service
app.get('/api/services/:id/reviews', (req, res) => {
  const reviews = db.orders
    .filter(o => o.serviceId === req.params.id && o.rating)
    .map(o => ({
      orderId: o.id, rating: o.rating, review: o.review || '', reviewedAt: o.reviewedAt,
      userName: o.userName, packageName: o.packageName
    }))
    .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  res.json({ reviews, averageRating: avg ? parseFloat(avg) : null, totalReviews: reviews.length });
});

// Admin: get all reviews across all orders
app.get('/api/admin/reviews', auth, adminOnly, (req, res) => {
  const reviews = db.orders
    .filter(o => o.rating)
    .map(o => ({
      orderId: o.id, serviceId: o.serviceId, serviceName: o.serviceName,
      rating: o.rating, review: o.review || '', reviewedAt: o.reviewedAt,
      userName: o.userName, userEmail: o.userEmail, packageName: o.packageName
    }))
    .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  res.json({ reviews, averageRating: avg ? parseFloat(avg) : null, totalReviews: reviews.length });
});

// ===================================================================
// CRYPTO PAYMENTS — admin wallet management + payment confirmation
// ===================================================================

// Admin: list all crypto wallets
app.get('/api/admin/crypto/wallets', auth, adminOnly, (req, res) => {
  const wallets = (db.cryptoWallets || []).sort((a, b) => {
    // Active wallets first, then by symbol
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.symbol.localeCompare(b.symbol);
  });
  res.json({ wallets, coins: cryptoPay.COINS });
});

// Admin: add a new crypto wallet
app.post('/api/admin/crypto/wallets', auth, adminOnly, (req, res) => {
  const { symbol, chain, address, label, active } = req.body || {};
  const sym = (symbol || '').toUpperCase().trim();
  if (!sym) return res.status(400).json({ error: 'Coin symbol is required' });
  if (!cryptoPay.COINS[sym]) return res.status(400).json({ error: 'Unsupported coin: ' + sym });
  if (!chain || !chain.trim()) return res.status(400).json({ error: 'Chain/network is required' });
  if (!address || !address.trim()) return res.status(400).json({ error: 'Wallet address is required' });

  const cleanAddr = address.trim();
  // Validate address format (warn but allow — some exotic chains may not be covered)
  if (!cryptoPay.isValidAddress(sym, cleanAddr, chain)) {
    return res.status(400).json({ error: `This doesn't look like a valid ${sym} address on ${chain}. Please double-check the address.` });
  }

  // Check for duplicate (same symbol + chain + address)
  const existing = (db.cryptoWallets || []).find(w =>
    w.symbol === sym && w.chain === chain.trim() && w.address.toLowerCase() === cleanAddr.toLowerCase()
  );
  if (existing) return res.status(400).json({ error: 'This wallet address already exists for this coin/chain' });

  const wallet = {
    id: 'cw_' + uid('w'),
    symbol: sym,
    name: cryptoPay.COINS[sym].name,
    chain: chain.trim(),
    address: cleanAddr,
    label: (label || '').trim() || `${sym} (${chain.trim()})`,
    active: active !== false, // default to active
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!Array.isArray(db.cryptoWallets)) db.cryptoWallets = [];
  db.cryptoWallets.push(wallet);
  save();
  logActivity('settings', `Added crypto wallet — ${sym} (${chain.trim()})`,
    `New ${sym} wallet on ${chain.trim()}: ${cleanAddr.slice(0, 12)}...${cleanAddr.slice(-6)}`);
  res.json({ success: true, wallet });
});

// Admin: edit a crypto wallet (update address, label, chain, or active status)
app.put('/api/admin/crypto/wallets/:id', auth, adminOnly, (req, res) => {
  const wallet = (db.cryptoWallets || []).find(w => w.id === req.params.id);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  const { chain, address, label, active } = req.body || {};

  if (address !== undefined) {
    const cleanAddr = (address || '').trim();
    if (!cleanAddr) return res.status(400).json({ error: 'Address cannot be empty' });
    const chainToCheck = chain || wallet.chain;
    if (!cryptoPay.isValidAddress(wallet.symbol, cleanAddr, chainToCheck)) {
      return res.status(400).json({ error: `This doesn't look like a valid ${wallet.symbol} address on ${chainToCheck}. Please double-check.` });
    }
    wallet.address = cleanAddr;
  }
  if (chain !== undefined) wallet.chain = chain.trim();
  if (label !== undefined) wallet.label = (label || '').trim() || `${wallet.symbol} (${wallet.chain})`;
  if (active !== undefined) wallet.active = !!active;

  wallet.updatedAt = new Date().toISOString();
  save();
  logActivity('settings', `Updated crypto wallet — ${wallet.symbol} (${wallet.chain})`,
    `Wallet ${wallet.id} updated${address !== undefined ? ' (new address: ' + wallet.address.slice(0, 12) + '...' + wallet.address.slice(-6) + ')' : ''}`);
  res.json({ success: true, wallet });
});

// Admin: toggle wallet active/inactive
app.patch('/api/admin/crypto/wallets/:id/toggle', auth, adminOnly, (req, res) => {
  const wallet = (db.cryptoWallets || []).find(w => w.id === req.params.id);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
  wallet.active = !wallet.active;
  wallet.updatedAt = new Date().toISOString();
  save();
  logActivity('settings', `${wallet.active ? 'Enabled' : 'Disabled'} crypto wallet — ${wallet.symbol}`,
    `Wallet ${wallet.id} (${wallet.symbol} ${wallet.chain}) is now ${wallet.active ? 'active' : 'inactive'}`);
  res.json({ success: true, wallet });
});

// Admin: delete a crypto wallet
app.delete('/api/admin/crypto/wallets/:id', auth, adminOnly, (req, res) => {
  const idx = (db.cryptoWallets || []).findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Wallet not found' });
  const [removed] = db.cryptoWallets.splice(idx, 1);
  save();
  logActivity('settings', `Deleted crypto wallet — ${removed.symbol}`,
    `Removed ${removed.symbol} wallet (${removed.chain}): ${removed.address.slice(0, 12)}...${removed.address.slice(-6)}`);
  res.json({ success: true, message: 'Wallet deleted' });
});

// Admin: list pending crypto payments (orders awaiting admin verification)
app.get('/api/admin/crypto/pending', auth, adminOnly, (req, res) => {
  const pending = db.orders
    .filter(o => o.paymentMethod === 'crypto' && o.paymentStatus !== 'paid')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(o => ({
      id: o.id,
      userName: o.userName,
      userEmail: o.userEmail,
      serviceName: o.serviceName,
      packageName: o.packageName,
      price: o.price,
      cryptoSymbol: o.cryptoSymbol,
      cryptoChain: o.cryptoChain,
      cryptoAddress: o.cryptoAddress,
      cryptoAmount: o.cryptoAmount,
      cryptoCustomerPaid: o.cryptoCustomerPaid || false,
      cryptoCustomerPaidAt: o.cryptoCustomerPaidAt,
      cryptoTxHash: o.cryptoTxHash,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
    }));
  res.json({ pending, count: pending.length });
});

// Admin: confirm a crypto payment (marks order as paid → triggers AI generation)
app.post('/api/admin/crypto/confirm', auth, adminOnly, async (req, res) => {
  const { orderId, txHash } = req.body || {};
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.paymentMethod !== 'crypto') return res.status(400).json({ error: 'This order is not a crypto payment' });
  if (order.paymentStatus === 'paid') return res.status(400).json({ error: 'This order is already paid' });

  // Mark the order as paid using the existing markOrderPaid function
  // This triggers automatic AI generation + customer notification
  await markOrderPaid(order, {
    channel: 'crypto-' + order.cryptoSymbol,
    paidAt: new Date().toISOString(),
    amount: order.cryptoAmount,
    currency: order.cryptoSymbol,
    source: 'admin',
  });

  // Record crypto-specific confirmation details
  order.cryptoConfirmed = true;
  order.cryptoConfirmedAt = new Date().toISOString();
  order.cryptoConfirmedBy = req.user.email;
  if (txHash && txHash.trim()) order.cryptoTxHash = txHash.trim();
  order.timeline.push({
    status: 'paid',
    at: new Date().toISOString(),
    note: `Crypto payment confirmed by admin (${req.user.email})${txHash ? ' — TX: ' + txHash.trim() : ''}`,
  });
  save();

  logActivity('payment', `Crypto payment confirmed — ${order.id}`,
    `${order.userName} paid ${order.cryptoAmount} ${order.cryptoSymbol} (${order.cryptoChain}) for $${order.price}${txHash ? ' — TX: ' + txHash : ''}`);

  notify('payment', `✅ Crypto payment confirmed — ${order.id}`,
    `Admin confirmed crypto payment for order ${order.id}.\n\n• Customer: ${order.userName} (${order.userEmail})\n• Amount: ${order.cryptoAmount} ${order.cryptoSymbol} = $${order.price}\n• TX: ${txHash || 'N/A'}\n• Confirmed by: ${req.user.email}\n\nAI generation has been triggered automatically.`);

  res.json({ success: true, message: 'Payment confirmed. AI generation has been triggered.', order });
});

// ===================================================================
// COUPON / DISCOUNT CODES — admin manages promo codes
// ===================================================================

// Admin: create a coupon
app.post('/api/admin/coupons', auth, adminOnly, (req, res) => {
  const { code, discountPct, maxUses, expiresAt } = req.body || {};
  if (!code || !code.trim()) return res.status(400).json({ error: 'Coupon code is required' });
  const cleanCode = code.trim().toUpperCase();
  if (db.coupons.some(c => c.code === cleanCode && c.active)) {
    return res.status(409).json({ error: 'A coupon with this code already exists' });
  }
  const pct = parseFloat(discountPct);
  if (!pct || pct <= 0 || pct > 100) return res.status(400).json({ error: 'Discount must be between 1 and 100 percent' });
  const coupon = {
    id: uid('cpn'),
    code: cleanCode,
    discountPct: pct,
    maxUses: maxUses ? parseInt(maxUses, 10) : null,   // null = unlimited
    uses: 0,
    expiresAt: expiresAt || null,
    active: true,
    createdAt: new Date().toISOString()
  };
  db.coupons.push(coupon);
  save();
  logActivity('pricing', `Coupon created: ${cleanCode}`, `${pct}% discount, max ${maxUses || 'unlimited'} uses`);
  notify('pricing', `🎫 New coupon: ${cleanCode}`, `${pct}% discount code created by ${req.user.name}.`);
  res.json({ coupon });
});

// Admin: list all coupons
app.get('/api/admin/coupons', auth, adminOnly, (req, res) => {
  res.json({ coupons: db.coupons || [] });
});

// Admin: delete/deactivate a coupon
app.delete('/api/admin/coupons/:id', auth, adminOnly, (req, res) => {
  const coupon = (db.coupons || []).find(c => c.id === req.params.id);
  if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
  coupon.active = false;
  save();
  logActivity('pricing', `Coupon deactivated: ${coupon.code}`, `by ${req.user.name}`);
  res.json({ ok: true, message: `Coupon ${coupon.code} deactivated` });
});

// Public: validate a coupon code and return the discount
app.post('/api/coupons/validate', (req, res) => {
  const { code } = req.body || {};
  if (!code || !code.trim()) return res.status(400).json({ error: 'Coupon code is required' });
  const cleanCode = code.trim().toUpperCase();
  const coupon = (db.coupons || []).find(c => c.code === cleanCode && c.active);
  if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon code' });
  if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
    return res.status(400).json({ error: 'This coupon has reached its usage limit' });
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'This coupon has expired' });
  }
  res.json({ valid: true, code: coupon.code, discountPct: coupon.discountPct, couponId: coupon.id });
});

app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  res.json({ users: db.users.map(u => u ? publicUser(u) : null).filter(Boolean) });
});

// ── Phase 8: Admin referral endpoints ─────────────────────────────
// Get all referral activity with bounty summary
app.get('/api/admin/referrals', auth, adminOnly, (req, res) => {
  const referrals = (db.referrals || []).map(r => {
    const referrer = db.users.find(u => u && u.id === r.referrerId);
    const referred = db.users.find(u => u && u.id === r.referredId);
    return {
      id: r.id,
      referrerId: r.referrerId,
      referrerName: r.referrerName,
      referrerEmail: referrer ? referrer.email : null,
      referrerCode: r.referrerCode,
      referredId: r.referredId,
      referredName: r.referredName,
      referredEmail: r.referredEmail,
      status: r.status,               // 'registered' or 'first_order'
      bountyAmount: r.bountyAmount,
      bountyStatus: r.bountyStatus,    // 'pending', 'earned', 'paid'
      createdAt: r.createdAt,
      firstOrderAt: r.firstOrderAt,
      firstOrderId: r.firstOrderId,
      paidAt: r.paidAt
    };
  });

  // Summary stats
  const totalReferrals = referrals.length;
  const totalRegistered = referrals.filter(r => r.status === 'registered').length;
  const totalFirstOrder = referrals.filter(r => r.status === 'first_order').length;
  const totalBountiesEarned = referrals.filter(r => r.bountyStatus === 'earned' || r.bountyStatus === 'paid').length;
  const totalBountiesPaid = referrals.filter(r => r.bountyStatus === 'paid').length;
  const totalBountiesOutstanding = referrals.filter(r => r.bountyStatus === 'earned').length * REFERRAL_BOUNTY_NGN;
  const totalBountiesPaidAmount = referrals.filter(r => r.bountyStatus === 'paid').length * REFERRAL_BOUNTY_NGN;
  const totalBountiesAllTime = totalBountiesEarned * REFERRAL_BOUNTY_NGN;

  res.json({
    referrals: referrals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    bountyPerReferral: REFERRAL_BOUNTY_NGN,
    summary: {
      totalReferrals,
      totalRegistered,
      totalFirstOrder,
      totalBountiesEarned,
      totalBountiesPaid,
      totalBountiesOutstanding,   // ₦ owed but not yet paid
      totalBountiesPaidAmount,    // ₦ already paid out
      totalBountiesAllTime        // ₦ total earned (paid + outstanding)
    }
  });
});

// Mark a referral bounty as paid
app.post('/api/admin/referrals/:id/mark-paid', auth, adminOnly, (req, res) => {
  const referral = (db.referrals || []).find(r => r.id === req.params.id);
  if (!referral) return res.status(404).json({ error: 'Referral record not found' });
  if (referral.bountyStatus === 'paid') return res.status(400).json({ error: 'This bounty has already been marked as paid' });
  if (referral.bountyStatus !== 'earned') return res.status(400).json({ error: 'Bounty can only be marked as paid after the referred user has placed their first order' });

  referral.bountyStatus = 'paid';
  referral.paidAt = new Date().toISOString();
  save();

  // Notify the referrer that their bounty has been paid
  const referrer = db.users.find(u => u && u.id === referral.referrerId);
  if (referrer) {
    notifyUser(referrer, 'referral',
      '💰 Referral bounty paid!',
      `Your referral bounty of ₦${REFERRAL_BOUNTY_NGN.toLocaleString()} for referring ${referral.referredName} has been paid!\n\n` +
      `Thank you for spreading the word about CreatiHub. Keep sharing your code ${referrer.referralCode} to earn more.`);
  }

  // Notify admin
  notify('referral', `💰 Referral bounty paid — ${referrer ? referrer.name : 'referrer'}`,
    `Bounty of ₦${REFERRAL_BOUNTY_NGN.toLocaleString()} for referring ${referral.referredName} has been marked as paid.\n\n` +
    `Referrer: ${referrer ? referrer.name + ' (' + referrer.email + ')' : 'unknown'}\n` +
    `Referred: ${referral.referredName} (${referral.referredEmail})`);

  logActivity('referral', `Referral bounty paid — ${referrer ? referrer.name : 'referrer'}`,
    `₦${REFERRAL_BOUNTY_NGN.toLocaleString()} bounty paid to ${referrer ? referrer.name : 'referrer'} for referring ${referral.referredName}.`);

  res.json({ ok: true, referral });
});

// Admin can reset ANY account's password (users and other admins).
// Sets a temporary password and revokes all sessions for that account.
app.put('/api/admin/users/:id/reset-password', auth, adminOnly, (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  const target = db.users.find(u => u && u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  target.password = hashPassword(newPassword);
  revokeUserTokens(target.id);
  save();
  logActivity('security', 'Admin reset password', `${req.user.name} reset the password for ${target.name} (${target.email})`);
  notify('security', '🔐 Password reset by admin', `${req.user.name} reset the login password for ${target.name} (${target.email}).`);
  res.json({ ok: true, message: `Password reset for ${target.email}` });
});

app.post('/api/admin/chat', auth, adminOnly, (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });
    const result = safeAdminAssistant(message, req.user.name);
    db.adminChats.push({ id: uid('ac'), role: 'admin', message, at: new Date().toISOString() });
    db.adminChats.push({ id: uid('ac'), role: 'assistant', message: result.reply, at: new Date().toISOString() });
    save();
    res.json(result);
  } catch (err) {
    console.error('Admin chat error:', err.message);
    res.json({
      reply: "I'm your AI business analyst. I can help with business summaries, pending orders, best sellers, revenue breakdowns, and growth insights. What would you like to know?",
      suggestions: ['Business summary', 'Show pending orders', 'Growth insights']
    });
  }
});

// ---------------- Admin: Co-Founder AI (Marketing & Advertising) ----------------
// A dedicated AI assistant that acts as a creative co-founder — generates
// cartoon video ad concepts, social media campaigns, marketing strategies,
// ad copy, budget plans, and growth tactics to pull more crowds.
app.post('/api/admin/cofounder', auth, adminOnly, (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });
    const result = safeCoFounderAssistant(message, req.user.name);
    db.adminChats.push({ id: uid('ac'), role: 'admin', message: '[Co-Founder] ' + message, at: new Date().toISOString() });
    db.adminChats.push({ id: uid('ac'), role: 'assistant', message: result.reply, at: new Date().toISOString() });
    save();
    res.json(result);
  } catch (err) {
    console.error('Co-Founder AI error:', err.message);
    res.json({
      reply: "I'm your AI Co-Founder! I can help with marketing strategies, cartoon video ads, social media campaigns, ad copy, budget planning, and growth tactics. What would you like to work on?",
      suggestions: ['Create a cartoon video ad', 'How to get 10,000 visitors', 'Write ad copy that converts', 'Plan a social media campaign']
    });
  }
});

// ===================================================================
// CO-FOUNDER AI — REAL CREATIVE GENERATION
// The admin asks the Co-Founder AI to actually generate a creative asset
// (cartoon image, flyer, short video script, logo, social media graphic).
// This creates a synthetic "marketing asset" order, runs the real AI
// generation engine (generator.js), stores the deliverables, and returns
// download links the admin can use immediately.
// ===================================================================

// Map natural-language generate requests to real CreatiHub services
const MARKETING_GEN_MAP = {
  // keyword pattern → { serviceId, serviceName, defaultPrompt }
  'cartoon': {
    serviceId: 'cartoon-maker',
    serviceName: 'Cartoon & Avatar Maker',
    defaultPrompt: 'Create a fun, eye-catching cartoon mascot character for CreatiHub advertising. Bright colors, friendly expression, modern style. This will be used in social media ads to promote our creative services marketplace.'
  },
  'flyer': {
    serviceId: 'flyer-design',
    serviceName: 'Flyer & Poster Design',
    defaultPrompt: 'Design a promotional flyer for CreatiHub — a global creative services marketplace. Headline: "From Blank to Brilliant in 24 Hours". Include: logo, 3-4 key services (flyer design, logo, video, cartoons), starting price $15, call to action "Visit creatihub.com.ng". Modern, colorful, professional.'
  },
  'poster': {
    serviceId: 'flyer-design',
    serviceName: 'Flyer & Poster Design',
    defaultPrompt: 'Design a promotional poster for CreatiHub — a global creative services marketplace. Bold headline, services list, pricing, and a strong call to action. Modern and eye-catching.'
  },
  'video': {
    serviceId: 'automated-video',
    serviceName: 'Automated Video Creation',
    defaultPrompt: 'Create a 20-30 second promotional video ad for CreatiHub. Script: Hook "Need professional design but can\'t afford an agency?" → Show services (flyers, logos, videos, cartoons) → Reveal pricing "Starting at just $15" → CTA "Visit creatihub.com.ng today". Upbeat, energetic, modern.'
  },
  'short video': {
    serviceId: 'automated-video',
    serviceName: 'Automated Video Creation',
    defaultPrompt: 'Create a short 15-20 second promotional video ad for CreatiHub creative services marketplace. Fast-paced, engaging, with a clear call to action.'
  },
  'ad video': {
    serviceId: 'automated-video',
    serviceName: 'Automated Video Creation',
    defaultPrompt: 'Create a promotional ad video for CreatiHub. Highlight our services, speed (24h delivery), and affordable pricing. End with visit creatihub.com.ng.'
  },
  'logo': {
    serviceId: 'logo-design',
    serviceName: 'Logo & Brand Identity',
    defaultPrompt: 'Design a modern, memorable logo for CreatiHub — a global creative services marketplace. The logo should convey creativity, speed, and professionalism. Clean, scalable, works on light and dark backgrounds.'
  },
  'social': {
    serviceId: 'social-media-kit',
    serviceName: 'Social Media Kit',
    defaultPrompt: 'Create a social media graphics kit for CreatiHub — profile picture, cover banner, and 3 post templates for Instagram/Facebook. Modern, colorful, on-brand.'
  },
  'thumbnail': {
    serviceId: 'youtube-thumbnails',
    serviceName: 'YouTube Thumbnails',
    defaultPrompt: 'Create a YouTube thumbnail for a CreatiHub promo video. Bold text "Get Pro Design for $15", show before/after, high contrast, click-worthy.'
  },
  'voiceover': {
    serviceId: 'voiceover',
    serviceName: 'Professional Voiceover',
    defaultPrompt: 'Create a 20-second voiceover for a CreatiHub ad: "Need professional design but on a budget? CreatiHub delivers flyers, logos, videos, and more — starting at just fifteen dollars. Visit creati hub dot com dot ng today. From blank to brilliant in twenty-four hours." Energetic, friendly, professional tone.'
  },
  'jingle': {
    serviceId: 'music-jingles',
    serviceName: 'Music & Jingles',
    defaultPrompt: 'Create a short 10-15 second catchy jingle for CreatiHub. Upbeat, modern, memorable. Lyrics: "CreatiHub — from blank to brilliant!"'
  },
  'copy': {
    serviceId: 'seo-copywriting',
    serviceName: 'SEO Copywriting',
    defaultPrompt: 'Write ad copy for CreatiHub creative services marketplace. Include: headline, 3 benefit bullets, and call to action. Target small business owners who need affordable professional design.'
  },
  'pitch': {
    serviceId: 'pitch-deck',
    serviceName: 'Pitch Deck Design',
    defaultPrompt: 'Create a marketing pitch deck for CreatiHub — cover slide, problem, solution, services overview, pricing, and call to action. Professional, investor-ready.'
  }
};

// Generate a real creative asset via the AI generation engine
app.post('/api/admin/cofounder/generate', auth, adminOnly, async (req, res) => {
  try {
    const { type, prompt } = req.body || {};
    if (!type) return res.status(400).json({ error: 'Generation type required (e.g. cartoon, flyer, video, logo)' });

    // Find the matching service
    const typeKey = type.toLowerCase().trim();
    let match = MARKETING_GEN_MAP[typeKey];
    if (!match) {
      // Try partial match
      const key = Object.keys(MARKETING_GEN_MAP).find(k => typeKey.includes(k) || k.includes(typeKey));
      if (key) match = MARKETING_GEN_MAP[key];
    }
    if (!match) {
      return res.status(400).json({
        error: `Unknown generation type "${type}". Available types: ${Object.keys(MARKETING_GEN_MAP).join(', ')}`
      });
    }

    // Check if AI generation is configured
    const { IS_LIVE, modeLabel } = require('./generator');
    if (!IS_LIVE) {
      return res.json({
        success: false,
        notConfigured: true,
        reply: `⚠️ **AI Generation Not Configured**\n\nI can generate real ${match.serviceName} files for you, but the AI generation engine needs an API key to work.\n\n**To enable real generation, set one of these environment variables on Railway:**\n• \`GEMINI_API_KEY\` — **FREE** from [Google AI Studio](https://aistudio.google.com) (recommended, no credit card needed)\n• \`OPENAI_API_KEY\` — from [OpenAI](https://platform.openai.com) (paid)\n\nOnce you add a key in Railway → Variables tab, I can instantly generate:\n• Real cartoon images 🎨\n• Real flyer/poster designs 📄\n• Real video ad scripts with storyboards 🎬\n• Real logo designs ⚡\n• Real voiceovers 🔊\n• Real social media graphics 📱\n\n**Meanwhile**, I've given you the complete creative concept and script above — you can use it to create the asset manually or through CreatiHub's own service ordering system.`,
        suggestions: ['How to set GEMINI_API_KEY', 'Order this via CreatiHub services', 'Create another ad concept']
      });
    }

    // Build a synthetic order for the generation engine
    const customPrompt = (prompt || '').trim();
    const order = {
      id: 'MKT-' + Date.now(),
      serviceId: match.serviceId,
      serviceName: match.serviceName,
      packageName: 'Standard',
      requirements: customPrompt || match.defaultPrompt,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email
    };

    // Run the real AI generation engine
    const { generate } = require('./generator');
    const result = await generate(order);

    // Store the generated asset in marketingAssets collection
    const asset = {
      id: uid('mkt'),
      type: typeKey,
      serviceId: match.serviceId,
      serviceName: match.serviceName,
      prompt: order.requirements,
      deliverables: [{ runId: Date.now(), mode: result.mode, items: result.deliverables, at: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      createdBy: req.user.name
    };
    if (!Array.isArray(db.marketingAssets)) db.marketingAssets = [];
    db.marketingAssets.unshift(asset);
    if (db.marketingAssets.length > 100) db.marketingAssets = db.marketingAssets.slice(0, 100);
    save();

    logAiActivity('order', req.user.email, 'Co-Founder AI generated marketing asset', `${match.serviceName} for advertising — ${result.deliverables.length} file(s)`);

    // Build download links
    const files = result.deliverables.map(f => ({
      id: f.id,
      filename: f.filename,
      kind: f.kind,
      mime: f.mime,
      summary: f.summary,
      assetId: asset.id,
      downloadUrl: `/api/admin/cofounder/assets/${asset.id}/download/${f.id}`
    }));

    res.json({
      success: true,
      assetId: asset.id,
      serviceName: match.serviceName,
      mode: result.mode,
      fileCount: result.deliverables.length,
      files,
      reply: `✅ **${match.serviceName} Generated Successfully!**\n\nI've created ${result.deliverables.length} file(s) using the ${result.mode} AI engine. You can download them below:\n\n${files.map(f => `• **${f.filename}** — ${f.summary}`).join('\n')}\n\nThese are ready to use in your advertising campaigns! Want me to generate another asset or refine this one?`,
      suggestions: ['Generate a cartoon image', 'Generate a flyer', 'Generate a video ad', 'Generate a logo']
    });
  } catch (err) {
    console.error('[Co-Founder generate] error:', err.message);
    res.json({
      success: false,
      reply: `I tried to generate that but ran into an issue: ${err.message}\n\nThis usually means the AI API key needs to be configured. You can set GEMINI_API_KEY (free) or OPENAI_API_KEY in your Railway Variables tab.`,
      suggestions: ['How to set GEMINI_API_KEY', 'Create a cartoon video ad concept', 'Write ad copy that converts']
    });
  }
});

// Download a generated marketing asset file
app.get('/api/admin/cofounder/assets/:assetId/download/:fileId', auth, adminOnly, (req, res) => {
  const asset = (db.marketingAssets || []).find(a => a.id === req.params.assetId);
  if (!asset) return res.status(404).json({ error: 'Marketing asset not found' });
  // Search all deliverable runs for a file matching fileId
  let file = null;
  for (const run of (asset.deliverables || [])) {
    file = (run.items || []).find(f => f.id === req.params.fileId);
    if (file) break;
  }
  if (!file) return res.status(404).json({ error: 'File not found' });
  res.setHeader('Content-Type', file.mime || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  // Deliverable content is base64 for binary (images/audio), plain text for text/html
  const isBinary = file.kind === 'image' || file.kind === 'audio' || file.kind === 'video';
  if (isBinary || file.encoding === 'base64') {
    res.send(Buffer.from(file.content, 'base64'));
  } else {
    res.send(file.content);
  }
});

// List all generated marketing assets
app.get('/api/admin/cofounder/assets', auth, adminOnly, (req, res) => {
  const assets = (db.marketingAssets || []).map(a => ({
    id: a.id,
    type: a.type,
    serviceName: a.serviceName,
    prompt: (a.prompt || '').slice(0, 100),
    fileCount: (a.deliverables || []).reduce((n, r) => n + (r.items || []).length, 0),
    createdAt: a.createdAt,
    createdBy: a.createdBy,
    files: (a.deliverables || []).flatMap(r => (r.items || []).map(f => ({
      id: f.id,
      filename: f.filename,
      kind: f.kind,
      summary: f.summary,
      downloadUrl: `/api/admin/cofounder/assets/${a.id}/download/${f.id}`
    })))
  }));
  res.json({ assets });
});

// ---------------- Admin: Live AI Activity feed ----------------
// Returns the most recent AI tasks so the admin can watch Nova work in real
// time. Supports a `since` param (ISO date) so the client can poll for only
// new entries since its last fetch.
app.get('/api/admin/ai-activity', auth, adminOnly, (req, res) => {
  const since = req.query.since ? new Date(req.query.since) : null;
  let items = db.aiActivity;
  if (since) items = items.filter(a => new Date(a.at) > since);
  res.json({ activity: items.slice(0, 100), total: db.aiActivity.length, serverTime: new Date().toISOString() });
});

// ---------------- Admin: Notifications ----------------
app.get('/api/admin/notifications', auth, adminOnly, (req, res) => {
  const unread = db.notifications.filter(n => !n.read).length;
  res.json({ notifications: db.notifications.slice(0, 50), unread });
});

app.put('/api/admin/notifications/:id/read', auth, adminOnly, (req, res) => {
  const n = markNotificationRead(req.params.id);
  if (!n) return res.status(404).json({ error: 'Notification not found' });
  res.json({ ok: true });
});

app.post('/api/admin/notifications/read-all', auth, adminOnly, (req, res) => {
  const changed = markAllNotificationsRead();
  res.json({ ok: true, cleared: changed });
});

// ---------------- Admin: General live activity feed ----------------
app.get('/api/admin/activity', auth, adminOnly, (req, res) => {
  res.json({ activity: db.activity.slice(0, 100), total: db.activity.length, serverTime: new Date().toISOString() });
});

// ---------------- Admin: Service & Pricing management ----------------
// Full service list for the pricing editor (raw prices, no currency conversion).
app.get('/api/admin/services', auth, adminOnly, (req, res) => {
  res.json({ services: db.services });
});

// Edit a whole service (name, tagline, etc.). Used by the pricing panel.
app.put('/api/admin/services/:id', auth, adminOnly, (req, res) => {
  const svc = db.services.find(s => s.id === req.params.id);
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  const { name, tagline, category, deliveryDays } = req.body || {};
  if (name) svc.name = name.trim();
  if (tagline) svc.tagline = tagline.trim();
  if (category) svc.category = category.trim();
  if (deliveryDays != null) svc.deliveryDays = Math.max(1, parseInt(deliveryDays, 10) || svc.deliveryDays);
  save();
  logActivity('pricing', `Edited service ${svc.id}`, `Admin updated ${svc.name} details.`);
  res.json({ service: svc });
});

// Edit a single package's price (and optionally its name/description).
// This is the core "reduce service prices" action.
app.put('/api/admin/services/:id/packages/:pkgId', auth, adminOnly, (req, res) => {
  const svc = db.services.find(s => s.id === req.params.id);
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  const pkg = svc.packages.find(p => p.id === req.params.pkgId);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  const { price, name, desc } = req.body || {};
  const oldPrice = pkg.price;
  let changed = false;
  if (price != null) {
    const newPrice = Math.round(parseFloat(price) * 100) / 100;
    if (isNaN(newPrice) || newPrice < 0) return res.status(400).json({ error: 'Price must be a positive number' });
    if (newPrice > 10000) return res.status(400).json({ error: 'Price seems too high (max $10,000)' });
    pkg.price = newPrice;
    changed = true;
    logPriceChange(svc.id, svc.name, pkg.id, pkg.name, oldPrice, newPrice, req.user.name);
  }
  if (name) { pkg.name = name.trim(); changed = true; }
  if (desc) { pkg.desc = desc.trim(); changed = true; }
  if (!changed) return res.status(400).json({ error: 'No changes provided' });
  save();
  const dir = pkg.price < oldPrice ? 'reduced' : (pkg.price > oldPrice ? 'increased' : 'changed');
  logActivity('pricing', `Price ${dir} for ${svc.name} (${pkg.name})`,
    `${req.user.name} ${dir} ${svc.name} / ${pkg.name} from $${oldPrice} to $${pkg.price}.`);
  notify('pricing', `💲 Price ${dir} — ${svc.name}`,
    `${pkg.name} package for ${svc.name} was ${dir} from $${oldPrice} to $${pkg.price} by ${req.user.name}.`);
  res.json({ service: svc, package: pkg, oldPrice });
});

// Apply a percentage discount across ALL packages of a service at once.
app.post('/api/admin/services/:id/discount', auth, adminOnly, (req, res) => {
  const svc = db.services.find(s => s.id === req.params.id);
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  const { percent } = req.body || {};
  const pct = parseFloat(percent);
  if (isNaN(pct) || pct <= 0 || pct > 90) {
    return res.status(400).json({ error: 'Discount must be between 1% and 90%' });
  }
  const changes = [];
  svc.packages.forEach(pkg => {
    const oldPrice = pkg.price;
    const newPrice = Math.round((oldPrice * (1 - pct / 100)) * 100) / 100;
    pkg.price = newPrice;
    logPriceChange(svc.id, svc.name, pkg.id, pkg.name, oldPrice, newPrice, req.user.name);
    changes.push({ package: pkg.name, oldPrice, newPrice });
  });
  save();
  logActivity('pricing', `Applied ${pct}% discount to ${svc.name}`,
    `${req.user.name} applied a ${pct}% discount across all packages of ${svc.name}.`);
  notify('pricing', `💲 ${pct}% discount applied — ${svc.name}`,
    `A ${pct}% discount was applied to all packages of ${svc.name} by ${req.user.name}.\n\n${changes.map(c => `• ${c.package}: $${c.oldPrice} → $${c.newPrice}`).join('\n')}`);
  res.json({ service: svc, changes });
});

// Price change history (audit log).
app.get('/api/admin/price-history', auth, adminOnly, (req, res) => {
  res.json({ history: db.priceHistory.slice(0, 50) });
});

// ---------------- Admin: AI Safety & Security ----------------
app.get('/api/admin/ai-settings', auth, adminOnly, (req, res) => {
  res.json({ settings: db.aiSettings });
});

app.put('/api/admin/ai-settings', auth, adminOnly, (req, res) => {
  const s = req.body && req.body.settings;
  if (!s || typeof s !== 'object') return res.status(400).json({ error: 'Settings object required' });
  const cur = db.aiSettings;
  // Merge allowed fields only (never blindly replace to avoid corrupting shape)
  if (typeof s.enabled === 'boolean') cur.enabled = s.enabled;
  if (typeof s.adminAssistantEnabled === 'boolean') cur.adminAssistantEnabled = s.adminAssistantEnabled;
  if (s.rateLimit && typeof s.rateLimit === 'object') {
    cur.rateLimit = {
      maxMessages: Math.max(1, parseInt(s.rateLimit.maxMessages, 10) || cur.rateLimit.maxMessages),
      windowMinutes: Math.max(1, parseInt(s.rateLimit.windowMinutes, 10) || cur.rateLimit.windowMinutes)
    };
  }
  if (Array.isArray(s.blockedPhrases)) cur.blockedPhrases = s.blockedPhrases.map(String).filter(Boolean);
  if (Array.isArray(s.blockedTopics)) cur.blockedTopics = s.blockedTopics.map(String).filter(Boolean);
  if (s.guardrails && typeof s.guardrails === 'object') {
    const g = cur.guardrails;
    if (typeof s.guardrails.blockPromptInjection === 'boolean') g.blockPromptInjection = s.guardrails.blockPromptInjection;
    if (typeof s.guardrails.blockPersonalData === 'boolean') g.blockPersonalData = s.guardrails.blockPersonalData;
    if (s.guardrails.maxMessageLength != null) g.maxMessageLength = Math.max(100, parseInt(s.guardrails.maxMessageLength, 10) || g.maxMessageLength);
    if (typeof s.guardrails.refuseOnBlock === 'boolean') g.refuseOnBlock = s.guardrails.refuseOnBlock;
  }
  if (s.persona && typeof s.persona === 'object') {
    if (s.persona.name) cur.persona.name = String(s.persona.name).slice(0, 40);
    if (s.persona.tone) cur.persona.tone = String(s.persona.tone).slice(0, 200);
    if (s.persona.scope) cur.persona.scope = String(s.persona.scope).slice(0, 500);
  }
  save();
  logActivity('security', 'AI safety settings updated', `${req.user.name} updated Nova's safety / guardrail settings.`);
  notify('security', '🛡️ AI safety settings changed', `${req.user.name} updated Nova's safety configuration. Nova is currently ${cur.enabled ? 'ENABLED' : 'DISABLED'}.`);
  res.json({ settings: cur });
});

// AI safety audit trail (blocked / refused interactions).
app.get('/api/admin/ai-audit', auth, adminOnly, (req, res) => {
  res.json({ audit: db.aiAudit.slice(0, 50) });
});

// ---------------- Config ----------------
// ---------------- Admin: Database Backups ----------------
// Export the entire database as a downloadable JSON snapshot (instant backup)
app.get('/api/admin/export', auth, adminOnly, (req, res) => {
  const snap = JSON.stringify(db, null, 2);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="creatihub-export-${stamp}.json"`);
  logActivity('backup', `Data exported by admin`, `Admin downloaded a full database snapshot (${(snap.length / 1024).toFixed(1)} KB)`);
  res.send(snap);
});

// List available backups
app.get('/api/admin/backups', auth, adminOnly, (req, res) => {
  res.json({ backups: backup.listBackups(), maxFiles: parseInt(process.env.BACKUP_MAX_FILES || '30', 10) });
});

// Trigger a manual backup right now
app.post('/api/admin/backups', auth, adminOnly, (req, res) => {
  const r = backup.backupNow();
  if (r.ok) {
    logActivity('backup', `Manual backup created: ${r.file}`, `Admin triggered a database snapshot (${(r.size / 1024).toFixed(1)} KB)`);
    res.json(r);
  } else {
    res.status(400).json(r);
  }
});

// Download a specific backup file
app.get('/api/admin/backups/:file', auth, adminOnly, (req, res) => {
  const p = backup.getBackupPath(req.params.file);
  if (!p) return res.status(404).json({ error: 'Backup not found' });
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.file}"`);
  fs.createReadStream(p).pipe(res);
});

app.get('/api/config', (req, res) => {
  const settings = db.settings || {};
  const gen = require('./generator');
  // Active crypto wallets (only expose active ones + metadata, not private data)
  const activeWallets = (db.cryptoWallets || [])
    .filter(w => w.active)
    .map(w => ({
      id: w.id,
      symbol: w.symbol,
      name: w.name,
      chain: w.chain,
      address: w.address,
      label: w.label,
      icon: (cryptoPay.COINS[w.symbol] || {}).icon || '•',
      type: (cryptoPay.COINS[w.symbol] || {}).type || 'variable',
    }));
  res.json({
    currencies: Object.keys(CURRENCY_RATES),
    paystack: {
      publicKey: paystack.publicKey(),
      demo: paystack.isDemo()
    },
    crypto: {
      enabled: activeWallets.length > 0,
      wallets: activeWallets,
      coins: cryptoPay.COINS,
    },
    // AI generation engine status (dual-provider: Gemini + OpenAI)
    generator: {
      mode: gen.IS_LIVE ? 'live' : 'not_configured',
      label: gen.modeLabel(),
      providers: gen.PROVIDER || {},
      // Phase 6: which service kinds can the free-tier keys auto-fulfill?
      canAutoFulfillImages: !!(gen.PROVIDER && gen.PROVIDER.openai),
      imageRequiresManual: !(gen.PROVIDER && gen.PROVIDER.openai)
    },
    generatorMode: gen.IS_LIVE ? 'live' : 'not_configured',
    // Checkout upsells (exposed so the order page can render them)
    rushDelivery: settings.rushDelivery || { enabled: false },
    addons: Array.isArray(settings.addons) ? settings.addons : [],
    // Recurring monthly retainer plans
    subscriptionPlans: Array.isArray(settings.subscriptionPlans) ? settings.subscriptionPlans : []
  });
});

// ============================================================
// AI Diagnostic endpoint — admin only
// Returns raw Gemini API responses/errors for image gen, TTS, and text
// so we can debug why image generation falls back to concept briefs.
// ============================================================
app.get('/api/admin/ai-diagnostic', auth, adminOnly, async (req, res) => {
  try {
    const { diagnoseImage } = require('./generator');
    const prompt = req.query.prompt || 'A simple red circle on a white background';
    const result = await diagnoseImage(prompt);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e), stack: e.stack });
  }
});

// Payment callback page (Paystack redirects here after checkout)
app.get('/payment/callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-callback.html'));
});

// SPA-ish fallback for known pages
const pages = ['', 'services', 'learn', 'lesson', 'order', 'auth', 'dashboard', 'admin', 'training', 'training-dashboard', 'payment-callback'];
pages.forEach(p => {
  app.get('/' + p, (req, res) => res.sendFile(path.join(__dirname, 'public', (p || 'index') + '.html')));
});

// Training program detail page: /training/:programId
app.get('/training/program/:programId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'training-detail.html'));
});

// Training student dashboard: /training/dashboard/:enrollmentId
app.get('/training/dashboard/:enrollmentId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'training-dashboard.html'));
});

// My training enrollments overview: /training/my-training
app.get('/training/my-training', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'training-dashboard.html'));
});

// ============================================================
// Boot — hydrate the database (async for Postgres) then start listening
// ============================================================
// Health check endpoint (Railway / load balancers use this)
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Ninja site-builder connection monitor endpoint.
// The ninja-daytona-script.js (loaded by the site builder) periodically calls
// /__ninja/health and, on any non-OK response, shows a full-screen "Disconnected"
// overlay that locks the page (overflow:hidden). On a standalone Railway deploy
// this route doesn't exist by default (404), which traps users behind the overlay
// and looks like an endless "Loading..." state. Returning 200 keeps the monitor
// happy so the overlay never appears.
app.get('/__ninja/health', (req, res) => res.status(200).json({ ok: true }));

// ── Phase 9 debug: diagnose why safeUserAssistant throws on production ──
app.get('/__ninja/ai-debug', (req, res) => {
  const results = {};
  // 1. Check server.js's own db backend
  try {
    const d = getDb();
    results.serverGetDb = 'OK';
    results.serverServicesCount = (d.services || []).length;
    results.serverAiSettings = d.aiSettings ? 'exists' : 'MISSING';
    results.serverAiActivity = Array.isArray(d.aiActivity) ? 'array' : typeof d.aiActivity;
    results.serverAiAudit = Array.isArray(d.aiAudit) ? 'array' : typeof d.aiAudit;
    results.serverChats = Array.isArray(d.chats) ? 'array(' + d.chats.length + ')' : typeof d.chats;
  } catch (e) {
    results.serverGetDb = 'ERROR: ' + e.message;
  }
  // 2. Check ai.js's own backend indirectly via filterMessage (calls getDb)
  try {
    const filterResult = filterMessage('hi', null);
    results.aiFilterMessage = 'OK';
    results.aiFilterBlocked = filterResult.blocked;
  } catch (e) {
    results.aiFilterMessage = 'ERROR: ' + e.message;
  }
  // 3. Try running safeUserAssistant and capture the actual error
  try {
    const r = safeUserAssistant('hi', null);
    results.safeUserAssistant = 'OK';
    results.reply = String(r.reply || '').slice(0, 100);
  } catch (e) {
    results.safeUserAssistant = 'ERROR: ' + e.message;
    results.errorStack = e.stack ? e.stack.split('\n').slice(0, 5).join(' | ') : null;
  }
  // 4. Try running the raw userAssistant (bypasses safety filter)
  try {
    const r2 = userAssistant('hi', null);
    results.userAssistant = 'OK';
    results.reply2 = String(r2.reply || '').slice(0, 100);
  } catch (e) {
    results.userAssistant = 'ERROR: ' + e.message;
  }
  // 5. Check which backend ai.js is using
  results.aiBackendType = process.env.DATABASE_URL ? 'pg' : 'json';
  results.usePostgres = USE_POSTGRES;
  res.json(results);
});

// Catch-all 404 for unknown API routes (prevents unhandled route errors)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

async function start() {
  if (USE_POSTGRES) {
    try {
      // Await the PostgreSQL load so `db` is fully hydrated before serving.
      db = await dbBackend.load();
      console.log('✅ PostgreSQL backend connected successfully');
    } catch (pgErr) {
      // If PostgreSQL fails, fall back to JSON-file backend so the app still starts.
      // This prevents total outage if the DB is misconfigured or temporarily unavailable.
      console.error('⚠️ PostgreSQL connection failed:', pgErr.message);
      console.error('⚠️ Falling back to JSON-file backend...');
      USE_POSTGRES = false;
      const fileBackend = require('./db');
      dbBackend = fileBackend;
      // Re-assign all db functions to the JSON-file backend versions
      ({ getDb, save, uid, hashPassword, makeToken, generateReferralCode, logActivity, notify, sendEmail, createResetCode, verifyResetCode, consumeResetCode, revokeUserTokens, logAiActivity, aiAuditLog, logPriceChange, markNotificationRead, markAllNotificationsRead } = fileBackend);
      db = fileBackend.getDb();
      console.log('✅ Running with JSON-file backend (fallback mode)');
    }
  }
  // Bind to 0.0.0.0 so Railway's health check can reach the app
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ CreatiHub running on http://0.0.0.0:${PORT}`);
    // Start automatic daily database backups (protects user data).
    try { backup.startScheduler(); } catch (e) { console.error('Backup scheduler failed:', e.message); }
  });
  server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Retrying in 1s...`);
      setTimeout(() => process.exit(1), 1000);
    } else {
      console.error('Unexpected server error, exiting:', err);
      process.exit(1);
    }
  });
  return server;
}

// Global error handlers — prevent silent crashes from unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err?.message || err);
  // Don't exit immediately — let Railway's restart policy handle it
  // but log the error so we can see it in deploy logs
});

// Graceful shutdown on SIGTERM (Railway sends this on redeploy)
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM received — shutting down gracefully...');
  process.exit(0);
});

start().catch(err => {
  console.error('❌ Failed to start CreatiHub:', err.message);
  console.error(err.stack || err);
  process.exit(1);
});
