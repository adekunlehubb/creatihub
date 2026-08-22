# Crypto Payment System + Admin Wallet Management

## Backend
- [x] Create crypto.js module (wallet storage, payment verification, order matching)
- [x] Add cryptoWallets collection to db.js (ensureCollections + makeFreshDb)
- [x] Add seed wallets (BTC, ETH, USDT, LTC) in makeFreshDb
- [x] Add /api/config/crypto endpoint (expose active wallets + chain info to frontend)
- [x] Add POST /api/orders crypto flow — create order with paymentStatus awaiting_crypto
- [x] Add POST /api/orders/:id/crypto-paid — customer marks "I've Paid"
- [x] Add GET /api/orders/:id/crypto-details — fetch crypto payment details
- [x] Add POST /api/admin/crypto/confirm — admin manually confirms crypto payment (marks order paid)
- [x] Admin CRUD: GET /api/admin/crypto/wallets (list all)
- [x] Admin CRUD: POST /api/admin/crypto/wallets (add wallet)
- [x] Admin CRUD: PUT /api/admin/crypto/wallets/:id (edit wallet)
- [x] Admin CRUD: DELETE /api/admin/crypto/wallets/:id (remove wallet)
- [x] Admin CRUD: PATCH /api/admin/crypto/wallets/:id/toggle (enable/disable)
- [x] Admin pending payments: GET /api/admin/crypto/pending

## Frontend — Customer
- [x] Add crypto payment option on order/checkout page
- [x] Show wallet address + QR code + copy button when crypto selected
- [x] Show amount in crypto equivalent (BTC/ETH/USDT)
- [x] Show "I've Paid" button → notifies admin for manual confirmation
- [x] Show payment instructions (send X to address, then click confirm)

## Frontend — Admin Dashboard
- [x] Add Crypto Wallets management section in admin.html
- [x] List all wallets with edit/delete/toggle buttons
- [x] Add new wallet form (coin, chain, address, label, active toggle)
- [x] Edit wallet inline (address, label, active)
- [x] Pending crypto payments list with "Confirm Payment" button

## Testing
- [x] Syntax check all JS files (crypto.js, db.js, server.js, paystack.js — all OK)
- [ ] Local server test: admin wallet CRUD
- [ ] Local server test: customer crypto order flow
- [ ] Local server test: admin confirm payment
- [ ] Verify HTML has no broken tags
- [ ] Commit + push + verify on live site
