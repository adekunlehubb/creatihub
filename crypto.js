// crypto.js — Cryptocurrency payment support for CreatiHub
// ----------------------------------------------------------------------------
// Admins manage wallet addresses (BTC, ETH, USDT, LTC, etc.) from the admin
// dashboard. Customers see the active wallets at checkout, send crypto to the
// displayed address, then click "I've Paid" — the admin manually confirms the
// payment (verifies on-chain) and the order is marked paid + AI generation fires.
//
// Environment variables (all optional):
//   CRYPTO_USD_TO_BTC   - override BTC price (USD). If not set, uses a fallback.
//   CRYPTO_USD_TO_ETH   - override ETH price (USD).
//   CRYPTO_USD_TO_USDT  - always ~1 (stablecoin)
//
// Supported coins + chains are defined in COINS below. Admins can add any
// coin/chain combination via the admin dashboard.
// ----------------------------------------------------------------------------

const https = require('https');

// ---------------- Coin metadata ----------------
// Each coin has: symbol, name, icon (emoji), type (stable|variable), defaultChain
const COINS = {
  BTC:   { symbol: 'BTC',   name: 'Bitcoin',              icon: '₿',  type: 'variable',  chains: ['Bitcoin'] },
  ETH:   { symbol: 'ETH',   name: 'Ethereum',             icon: 'Ξ',  type: 'variable',  chains: ['ERC-20', 'Arbitrum', 'Optimism', 'Base'] },
  USDT:  { symbol: 'USDT',  name: 'Tether USD',           icon: '₮',  type: 'stable',    chains: ['ERC-20', 'TRC-20', 'BEP-20', 'Arbitrum', 'Optimism'] },
  USDC:  { symbol: 'USDC',  name: 'USD Coin',             icon: '₵',  type: 'stable',    chains: ['ERC-20', 'BEP-20', 'Arbitrum', 'Optimism', 'Base'] },
  LTC:   { symbol: 'LTC',   name: 'Litecoin',             icon: 'Ł',  type: 'variable',  chains: ['Litecoin'] },
  BNB:   { symbol: 'BNB',   name: 'BNB (Binance Coin)',   icon: '⬡',  type: 'variable',  chains: ['BEP-20', 'BEP-2'] },
  SOL:   { symbol: 'SOL',   name: 'Solana',               icon: '◎',  type: 'variable',  chains: ['Solana'] },
  TRX:   { symbol: 'TRX',   name: 'Tron',                 icon: '♢',  type: 'variable',  chains: ['Tron'] },
  MATIC: { symbol: 'MATIC', name: 'Polygon',              icon: '⬢',  type: 'variable',  chains: ['Polygon'] },
  XRP:   { symbol: 'XRP',   name: 'Ripple',               icon: '✕',  type: 'variable',  chains: ['XRPL'] },
  DOGE:  { symbol: 'DOGE',  name: 'Dogecoin',             icon: 'Ð',  type: 'variable',  chains: ['Dogecoin'] },
};

// Fallback crypto prices (USD) — used if live fetch fails or is disabled.
// Admins can override with env vars. These are approximate and should be
// updated periodically; the system also tries to fetch live prices.
const FALLBACK_PRICES = {
  BTC: 65000,
  ETH: 3200,
  USDT: 1,
  USDC: 1,
  LTC: 85,
  BNB: 580,
  SOL: 150,
  TRX: 0.12,
  MATIC: 0.7,
  XRP: 0.55,
  DOGE: 0.13,
};

let priceCache = { prices: { ...FALLBACK_PRICES }, ts: 0 };

// ---------------- Live price fetching ----------------
// Fetches current crypto prices from CoinGecko (free, no API key needed).
// Falls back to cached/env prices on failure. Called lazily and cached for
// 5 minutes to avoid rate-limiting.
async function fetchPrices() {
  const now = Date.now();
  if (priceCache.ts && (now - priceCache.ts) < 5 * 60 * 1000) {
    return applyEnvOverrides(priceCache.prices);
  }

  const coinIds = {
    BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', USDC: 'usd-coin',
    LTC: 'litecoin', BNB: 'binancecoin', SOL: 'solana', TRX: 'tron',
    MATIC: 'matic-network', XRP: 'ripple', DOGE: 'dogecoin',
  };

  return new Promise((resolve) => {
    const ids = Object.values(coinIds).join(',');
    const path = `/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    const req = https.request({
      hostname: 'api.coingecko.com',
      port: 443,
      path,
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'CreatiHub/1.0' },
      timeout: 8000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const prices = { ...FALLBACK_PRICES };
          for (const [sym, cgId] of Object.entries(coinIds)) {
            if (parsed[cgId] && parsed[cgId].usd) {
              prices[sym] = parsed[cgId].usd;
            }
          }
          priceCache = { prices, ts: now };
          resolve(applyEnvOverrides(prices));
        } catch {
          // Parse failed — use fallback
          priceCache = { prices: { ...FALLBACK_PRICES }, ts: now };
          resolve(applyEnvOverrides(priceCache.prices));
        }
      });
    });
    req.on('error', () => {
      priceCache = { prices: { ...FALLBACK_PRICES }, ts: now };
      resolve(applyEnvOverrides(priceCache.prices));
    });
    req.on('timeout', () => {
      req.destroy();
      priceCache = { prices: { ...FALLBACK_PRICES }, ts: now };
      resolve(applyEnvOverrides(priceCache.prices));
    });
    req.end();
  });
}

function applyEnvOverrides(prices) {
  if (process.env.CRYPTO_USD_TO_BTC)  prices.BTC  = parseFloat(process.env.CRYPTO_USD_TO_BTC);
  if (process.env.CRYPTO_USD_TO_ETH)  prices.ETH  = parseFloat(process.env.CRYPTO_USD_TO_ETH);
  if (process.env.CRYPTO_USD_TO_USDT) prices.USDT = parseFloat(process.env.CRYPTO_USD_TO_USDT);
  return prices;
}

// ---------------- Conversion helpers ----------------
// Convert a USD amount to a crypto amount given current prices.
// Returns { amount, symbol, usdValue, pricePerUnit }
function usdToCrypto(usdAmount, symbol) {
  const sym = (symbol || '').toUpperCase();
  const price = FALLBACK_PRICES[sym] || 0;
  if (!price) return { amount: 0, symbol: sym, usdValue: usdAmount, pricePerUnit: 0, error: 'Unknown coin' };
  const amount = usdAmount / price;
  // Format: stablecoins to 2 dp, BTC to 8 dp, others to 6 dp
  const decimals = COINS[sym] && COINS[sym].type === 'stable' ? 2
    : sym === 'BTC' ? 8 : 6;
  return {
    amount: parseFloat(amount.toFixed(decimals)),
    symbol: sym,
    usdValue: usdAmount,
    pricePerUnit: price,
    decimals,
  };
}

// Synchronous version using cached/fallback prices (for immediate display)
function usdToCryptoSync(usdAmount, symbol) {
  return usdToCrypto(usdAmount, symbol);
}

// ---------------- Validation helpers ----------------
// Basic address validation — not exhaustive, but catches obvious typos.
function isValidAddress(symbol, address, chain) {
  if (!address || typeof address !== 'string') return false;
  const addr = address.trim();
  if (addr.length < 25) return false;

  const sym = (symbol || '').toUpperCase();
  switch (sym) {
    case 'BTC':
      // Bitcoin: starts with 1, 3, or bc1
      return /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/i.test(addr);
    case 'ETH':
    case 'USDT':
    case 'USDC':
    case 'BNB':
    case 'MATIC':
      // EVM addresses: 0x + 40 hex chars (for ERC-20/BEP-20/Polygon/Base/etc.)
      if ((chain || '').toUpperCase() === 'TRC-20') {
        // TRC-20 USDT: starts with T + 33 chars
        return /^T[A-Za-z0-9]{33}$/.test(addr);
      }
      return /^0x[a-fA-F0-9]{40}$/.test(addr);
    case 'LTC':
      // Litecoin: starts with L, M, or ltc1
      return /^(L[a-km-zA-HJ-NP-Z1-9]{25,34}|M[a-km-zA-HJ-NP-Z1-9]{25,34}|ltc1[a-z0-9]{39,59})$/i.test(addr);
    case 'SOL':
      // Solana: base58, ~32-44 chars
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
    case 'TRX':
      // Tron: T + 33 chars
      return /^T[A-Za-z0-9]{33}$/.test(addr);
    case 'XRP':
      // Ripple: r + 24-34 chars
      return /^r[A-Za-z0-9]{24,34}$/.test(addr);
    case 'DOGE':
      // Dogecoin: D + 27-34 chars
      return /^D[A-Za-z0-9]{27,34}$/.test(addr);
    default:
      return addr.length >= 25 && addr.length <= 120;
  }
}

// ---------------- QR code helper ----------------
// Returns a QR code URL (using the qrserver.com API) for a payment URI.
// For most coins we use the standard URI scheme: coin:address?amount=X
function qrUrl(symbol, address, amount, chain) {
  const sym = (symbol || '').toUpperCase();
  const amt = amount ? `?amount=${amount}` : '';
  let uri;
  switch (sym) {
    case 'BTC':
      uri = `bitcoin:${address}${amt}`;
      break;
    case 'ETH':
    case 'USDT':
    case 'USDC':
    case 'BNB':
    case 'MATIC':
      if ((chain || '').toUpperCase() === 'TRC-20') {
        uri = `${address}`; // TRC-20 doesn't have a standard URI
      } else {
        uri = `ethereum:${address}${amt}`;
      }
      break;
    case 'LTC':
      uri = `litecoin:${address}${amt}`;
      break;
    case 'SOL':
      uri = `solana:${address}${amt}`;
      break;
    case 'TRX':
      uri = `tron:${address}${amt}`;
      break;
    case 'XRP':
      uri = `ripple:${address}${amt}`;
      break;
    case 'DOGE':
      uri = `dogecoin:${address}${amt}`;
      break;
    default:
      uri = address;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
}

// ---------------- Seed wallets ----------------
// Default wallets the admin can edit/replace. These are PLACEHOLDER addresses
// — the admin must replace them with their real wallet addresses.
function seedWallets() {
  return [
    {
      id: 'cw_btc',
      symbol: 'BTC',
      name: 'Bitcoin',
      chain: 'Bitcoin',
      address: 'bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      label: 'Main Bitcoin Wallet',
      active: false, // inactive until admin sets real address
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cw_usdt_trc',
      symbol: 'USDT',
      name: 'Tether USD',
      chain: 'TRC-20',
      address: 'Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      label: 'USDT TRC-20 (low fee)',
      active: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cw_eth',
      symbol: 'ETH',
      name: 'Ethereum',
      chain: 'ERC-20',
      address: '0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      label: 'Ethereum Wallet',
      active: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

module.exports = {
  COINS,
  FALLBACK_PRICES,
  fetchPrices,
  usdToCrypto,
  usdToCryptoSync,
  isValidAddress,
  qrUrl,
  seedWallets,
};
