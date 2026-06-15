# SalesKit Pro v3.1 — Technical Documentation

> For developers, DevOps engineers, and technical buyers taking over the codebase.
> Read this document fully and you will be able to deploy, operate, and extend the platform independently.

---

## 1. Architecture Overview

SalesKit Pro is a **Multi-tenant SaaS platform** — deploy once, serve hundreds of independent shops. Each shop has its own dashboard, chatbot widget, customer data, and billing — all completely isolated.

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND  (public/index.html + js/app.js + css/app.css)    │
│  Vanilla JS · Chart.js 4 · Socket.IO · 3,800+ lines        │
│  • 17 pages: Dashboard, CRM, Kanban, Inbox, Billing...      │
│  • Super Admin Panel built-in                               │
│  • Bilingual: Vietnamese / English (1-click toggle)         │
│  • Auto currency: VND / USD / EUR / JPY / SGD / GBP ...     │
│  • Responsive: desktop + tablet + mobile                    │
├─────────────────────────────────────────────────────────────┤
│  BACKEND  (Node.js 20 · Express 4 · Socket.IO 4)            │
│  • 75+ REST API endpoints · JWT authentication              │
│  • Auto-reply: Keyword → Product → AI → Fallback            │
│  • Real-time WebSocket (customer events, messages, billing) │
│  • TTL in-memory cache (shopByApiKey, widget config)        │
├─────────────────────────────────────────────────────────────┤
│  DATABASE  (PostgreSQL 16)                                  │
│  • 16 tables · Multi-tenancy via shop_id column             │
│  • Schema auto-initializes on first start                   │
│  • Connection pool: 50 connections                          │
├─────────────────────────────────────────────────────────────┤
│  CHANNELS (5 integrations)                                  │
│  Web Widget   → /widget/:apiKey/reply                       │
│  Facebook     → /webhook/:apiKey/facebook                   │
│  Zalo OA      → /webhook/:apiKey/zalo                       │
│  Telegram Bot → /webhook/:apiKey/telegram                   │
│  WhatsApp Biz → /webhook/:apiKey/whatsapp                   │
├─────────────────────────────────────────────────────────────┤
│  PAYMENTS                                                   │
│  VietQR + SePay/Casso  → domestic (VND)                    │
│  Stripe Checkout       → international (USD)               │
│  PayPal / Wise         → international (feature-flagged)    │
└─────────────────────────────────────────────────────────────┘
```

**Multi-tenancy:** Every database table has a `shop_id` column. All queries are scoped with `WHERE shop_id = $n`. Cross-tenant data access is architecturally impossible at the query level.

---

## 2. Project Structure

```
saleskit-pro/
├── server.js              Main API — 75+ endpoints, Socket.IO, billing, Stripe
├── webhook.js             Facebook / Zalo / Telegram / WhatsApp webhooks
├── ai.js                  Sentiment analysis, lead scoring, OpenAI / Gemini
├── db.js                  PostgreSQL pool (max=50) + full schema definition
├── init-db.js             createShop() — onboard new tenants
├── package.json           v3.1.0 — 10 production dependencies
├── .env.example           All environment variables documented
├── Dockerfile             Multi-stage build, non-root user
├── docker-compose.yml     App + PostgreSQL, health checks, volumes
├── pm2.config.js          PM2 fork/cluster config, 512MB memory guard
├── load-test.js           300-user concurrent load test
├── HANDOVER.md            Official transfer checklist
├── TECHNICAL-DOCS.md      This file
├── USER-GUIDE.md          End-user guide for shop owners
├── README.md              Quick start + API overview
├── .github/
│   └── workflows/ci.yml   GitHub Actions: test + lint + docker build
├── src/
│   ├── constants.js        Plan definitions, resource labels
│   ├── middleware/
│   │   ├── auth.js         JWT auth middleware (auth, adminOnly, superAuth)
│   │   └── loginGuard.js   Progressive lockout rate limiter
│   └── routes/
│       ├── billing.js      VietQR + Stripe billing
│       ├── broadcast.js    Bulk messaging
│       ├── copilot.js      Copilot AI assistant (freemium)
│       ├── orders.js       Order management (POS)
│       ├── portal.js       Customer self-service portal
│       ├── super.js        Super Admin routes
│       └── team.js         Staff management + RBAC
├── public/
│   ├── index.html          Dashboard SPA shell (1,111 lines)
│   ├── js/app.js           Dashboard JS (3,235 lines)
│   ├── css/app.css         Dashboard styles (427 lines)
│   ├── landing.html        Public landing page
│   ├── saleskit-widget-connected.js   Embeddable chat widget
│   └── vendor/
│       ├── chart.umd.min.js    Chart.js (bundled, offline-safe)
│       └── socket.io.min.js    Socket.IO client (bundled, offline-safe)
├── test/
│   └── smoke.test.js       15 unit tests — sentiment + lead scoring
└── guides/                 Copilot AI guide files (English)
```

---

## 3. Installation & First Run

### Requirements
- **Node.js** ≥ 18
- **PostgreSQL** ≥ 13 (local or cloud: Railway, Neon, Render, Supabase)

### Step 1 — Environment
```bash
cp .env.example .env
```
Minimum required (server **refuses to start** if missing):
```env
JWT_SECRET=<run: openssl rand -hex 32>
SUPER_ADMIN_USER=platform_admin
SUPER_ADMIN_PASS=<strong password>
DATABASE_URL=postgresql://user:pass@host:5432/saleskit_pro
```

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Initialize schema + demo shop
```bash
npm run init
# Creates: schema, demo shop, sample products/customers/rules
# Login: shopId=demo-shop  user=admin  pass=1234
```

### Step 4 — Start server
```bash
npm start           # production
npm run dev         # development (--watch auto-reload)
```

Verify: `http://localhost:4000/health` → `{"status":"ok","db":"postgresql","shops":1}`

Dashboard: `http://localhost:4000/app` | Landing: `http://localhost:4000/`

---

## 4. Database Schema (16 Tables)

| Table | Purpose |
|---|---|
| `shops` | Tenant root — 1 row per shop. Has `id`, `name`, `plan`, `api_key`, `copilot_used` |
| `users` | Staff accounts per shop. Role: `admin` or `agent` |
| `customers` | CRM records with `score`, `sentiment`, `status`, `portal_password` |
| `products` | Product catalog used by bot for recommendations |
| `rules` | Keyword auto-reply rules with `hits` counter |
| `bot_config` | Widget config (name, color, avatar, quick buttons, position) |
| `messages` | All conversations (in/out) across all 5 channels |
| `channel_tokens` | API tokens for Facebook / Zalo / Telegram / WhatsApp |
| `ai_config` | Per-shop OpenAI/Gemini API key + system prompt |
| `lead_events` | Individual lead scoring event log |
| `customer_assignments` | Assign customers to specific agents |
| `activity_log` | Full audit trail — every staff action |
| `billing` | Subscription orders: `pending → active → expired` |
| `bank_config` | Bank account for receiving VietQR payments per shop |
| `orders` | Customer purchase orders (POS module) |
| `plans` | Subscription plan config (prices, limits — editable via Super Admin) |
| `platform_config` | Platform-wide settings (bank, contact info) |

**Template variables in `rules.reply`:**
- `{product_name}` → first product name
- `{product_price}` → first product price
- `{product_list}` → list of up to 5 products (emoji + name + price)

---

## 5. Subscription Plans

| Plan | Price (VND) | Price (USD) | Customers | Products | Rules |
|---|---|---|---|---|---|
| Free | 0 | $0 | 100 | 10 | 5 |
| Basic | 299,000/mo | $12/mo | 500 | 50 | 30 |
| Pro | 699,000/mo | $28/mo | 5,000 | 200 | 100 |
| Enterprise | 1,999,000/mo | $80/mo | Unlimited | Unlimited | Unlimited |

- Limits are enforced automatically on create operations — returns HTTP 403 + upgrade prompt when exceeded
- Both payment buttons available: VietQR (VND) and Stripe (USD)
- Prices editable by Super Admin without code changes

---

## 6. Full API Reference

All `/api/*` routes (except login, register, platform-contact) require:
```
Authorization: Bearer <jwt_token>
```

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Shop login → returns JWT |
| PUT | `/api/auth/password` | Change password |
| POST | `/api/shops/register` | Self-register new shop (public) |

### CRM — Customers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | List customers (supports `?page=1&limit=50&status=hot&search=name`) |
| POST | `/api/customers` | Create customer (plan limit enforced) |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/customers/:id/timeline` | Full history: messages + score events + activity |
| PUT | `/api/customers/:id/portal-password` | Set customer portal password |

### Products & Rules
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/products` | List / create products |
| PUT/DELETE | `/api/products/:id` | Update / delete product |
| POST | `/api/upload-image` | Upload product image (base64, max 8MB) |
| GET/POST | `/api/rules` | List / create keyword rules |
| PUT/DELETE | `/api/rules/:id` | Update / delete rule |

### Chatbot & Widget
| Method | Endpoint | Description |
|---|---|---|
| GET/PUT | `/api/bot` | Get / update widget config |
| GET | `/widget/:apiKey/config.js` | Public — load widget config JS (cached 2 min) |
| POST | `/widget/:apiKey/reply` | Public — send message, get bot reply (rate-limited: 60/min) |

### Shared Inbox
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/inbox` | All conversations across all channels |
| GET | `/api/inbox/messages` | Messages for one conversation |
| POST | `/api/inbox/reply` | Staff reply to conversation |
| POST | `/api/inbox/link-customer` | Link conversation to a CRM customer |

### Channels
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/channels` | Get saved channel tokens |
| PUT | `/api/channels/:channel` | Save token — `facebook` / `zalo` / `telegram` / `whatsapp` |
| GET + POST | `/webhook/:apiKey/facebook` | Facebook webhook verify + receive |
| POST | `/webhook/:apiKey/zalo` | Zalo webhook receive |
| POST | `/webhook/:apiKey/telegram` | Telegram webhook receive |
| GET + POST | `/webhook/:apiKey/whatsapp` | WhatsApp webhook verify + receive |

### AI Configuration
| Method | Endpoint | Description |
|---|---|---|
| GET/PUT | `/api/ai-config` | Get / save AI provider, key, model, system prompt |
| POST | `/api/ai-config/test` | Test AI with a sample message |

### Lead Scoring
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/leads` | Top 20 leads ranked by score |
| POST | `/api/leads/:id/score` | Manually add score to a customer |
| GET | `/api/sentiment-stats` | Sentiment breakdown statistics |

### Team Management (RBAC)
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/team` | List / add staff members |
| DELETE | `/api/team/:id` | Remove staff member |
| PUT | `/api/team/:id/role` | Change role (admin / agent) |
| PUT | `/api/team/:id/reset-password` | Reset staff password |
| POST | `/api/team/assign` | Assign customer to agent |
| POST | `/api/team/bulk-assign` | Bulk assign customers |
| DELETE | `/api/team/assign/:cid/:uid` | Remove assignment |
| GET | `/api/team/:id/customers` | Get all customers of an agent |

### Billing
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/billing/plans` | All plans with VND + USD prices (public) |
| GET | `/api/billing` | Current plan + order history |
| POST | `/api/billing/create-order` | Create order + VietQR payment QR |
| GET | `/api/billing/order/:ref/status` | Poll order status |
| POST | `/api/billing/confirm` | Admin manually approve order |
| POST | `/api/billing/cancel` | Cancel pending order |
| POST | `/api/billing/webhook/bank` | Receive SePay/Casso bank callback |
| POST | `/api/billing/stripe/create-session` | Create Stripe Checkout session |
| POST | `/api/billing/stripe/webhook` | Stripe payment confirmation webhook |

### Orders (POS)
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/orders` | List / create customer orders |
| PUT | `/api/orders/:id` | Update order status |

### Broadcast
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/broadcast` | Send bulk message to customer segment |

### Copilot AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/copilot` | Copilot AI reply (freemium: 7 free → paid) |

### GDPR
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/gdpr/export` | Export all shop data as JSON |
| DELETE | `/api/gdpr/erase` | Permanently erase all shop data |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stats` | Dashboard stats (customers, messages, revenue) |
| GET | `/api/reports/funnel` | Conversion funnel with status transitions |

### Customer Portal
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/portal/login` | Customer login with phone + password |
| GET | `/api/portal/me` | Customer view own info + message history |

### Super Admin
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/super/login` | Super admin login |
| GET | `/api/super/dashboard` | Platform-wide stats |
| GET/POST | `/api/super/shops` | List all shops / create shop |
| DELETE | `/api/super/shops/:id` | Delete shop (cascades all data) |
| POST | `/api/super/impersonate/:shopId` | Login as any shop |
| GET/PUT | `/api/super/bank-config` | Platform bank account config |
| GET/PUT | `/api/super/platform-contact` | Platform contact info |
| GET/PUT | `/api/super/plans/:id` | Edit plan pricing and limits |

### Dev & Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check — `{"status":"ok","shops":N}` |
| POST | `/api/dev/simulate` | Simulate an incoming message (testing) |

---

## 7. Onboarding a New Shop

### Option 1 — Self-registration (from landing page)
Customer clicks "Start Free Trial" → fills shop name + credentials → shop created on Free plan.

### Option 2 — Super Admin creates manually
Super Admin panel → "Create New Shop" → fill details → choose plan.

### Option 3 — Programmatic
```javascript
const { createShop } = require('./init-db');
const result = await createShop({
  shopId:    'fashion-store-xyz',
  shopName:  'Fashion Store XYZ',
  adminUser: 'admin',
  adminPass: 'securepassword',
  plan:      'pro',     // free | basic | pro | enterprise
  seed:      false,     // true = create sample products/customers/rules
});
console.log(result.apiKey); // use this to embed the widget
```

**Embed the widget on any website:**
```html
<script src="https://your-backend.com/widget/API_KEY/config.js"></script>
<script src="https://your-backend.com/saleskit-widget-connected.js"></script>
```

---

## 8. Channel Integration

### Facebook Messenger
1. `developers.facebook.com` → App → Messenger → Settings
2. Link your Facebook Page → get **Page Access Token**
3. Dashboard → Channels → Facebook → enter token + verify token → Save
4. Webhook URL: `https://your-backend.com/webhook/<API_KEY>/facebook`
5. Verify Token = value entered in step 3
6. Subscribe to: `messages`

### Zalo Official Account
1. `developers.zalo.me` → App → Link Zalo OA → get **OA Access Token**
2. Dashboard → Channels → Zalo → enter token → Save
3. Webhook URL: `https://your-backend.com/webhook/<API_KEY>/zalo`
4. Enable event: `user_send_text`

### Telegram Bot
```
1. Chat with @BotFather → /newbot → get Bot Token
2. Dashboard → Channels → Telegram → enter token → Save
3. Click "Auto-register Webhook" button (recommended)

   — OR manually:
   GET https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-backend.com/webhook/<API_KEY>/telegram
```

### WhatsApp Business
1. `developers.facebook.com` → App → WhatsApp → API Setup
2. Get **Access Token** (System User Token) + **Phone Number ID**
3. Dashboard → Channels → WhatsApp → enter all fields → Save
4. Webhook URL: `https://your-backend.com/webhook/<API_KEY>/whatsapp`
5. Subscribe to: `messages`

---

## 9. Payment Setup

### VietQR (Domestic — Vietnam)
```
Customer selects plan → System generates VietQR code
→ Customer scans and transfers: "SALESKIT <shopId> <ref>"
→ SePay/Casso receives → calls webhook → plan activated
→ Dashboard updates in real-time (Socket.IO)
```

**Configure SePay:**
1. Super Admin → Bank Config → enter bank account
2. Set `BANK_WEBHOOK_SECRET` in `.env`
3. Register webhook at SePay dashboard:
   ```
   POST https://your-backend.com/api/billing/webhook/bank?secret=YOUR_SECRET
   ```

### Stripe (International)
```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
```
Register Stripe webhook at `dashboard.stripe.com/webhooks`:
```
POST https://your-backend.com/api/billing/stripe/webhook
Event: checkout.session.completed
```
Test card: `4242 4242 4242 4242` (any future date, any CVC)

---

## 10. Auto-Reply Engine

```
1. Keyword matching
   rule.keyword uses "|" for OR: "price|how much|cost"
   → Match found → return rule reply (supports {product_name}, {product_price}, {product_list})
   → hits++ (analytics counter)

2. Product name matching
   Product names > 3 chars matched against message text
   → Return product info automatically

3. AI fallback (if API key configured)
   OpenAI gpt-4o-mini OR Google Gemini 2.5 Flash
   System prompt customizable per shop in AI Agent Config

4. Default fallback
   Returns one of 2 friendly default messages randomly
```

All 5 channels (Web, Facebook, Zalo, Telegram, WhatsApp) share this single engine.

---

## 11. Lead Scoring System

| Event | Points |
|---|---|
| Any message sent | +5 |
| Price inquiry (price, how much, cost) | +15 |
| Purchase intent (buy, order, checkout) | +25 |
| Phone number provided | +20 |
| Shipping inquiry | +10 |
| Location/address inquiry | +10 |
| Product browsing (view catalog, list) | +8 |

**Automatic status upgrades:**
- Score ≥ 80 + status `new` → promotes to `hot`
- Score ≥ 150 + status `hot` → promotes to `close`

---

## 12. Bilingual & Auto-Currency

### Bilingual UI (VI / EN)
- Toggle button in dashboard top-right: 🇬🇧 EN / 🇻🇳 VI
- Auto-detected from `navigator.language` on first load
- Translates: sidebar, page titles, buttons, labels, placeholders, channel status
- Preference saved to `localStorage`

### Automatic Currency Detection
Detects browser timezone → maps to local currency:

| Region | Example Timezone | Currency |
|---|---|---|
| Vietnam | Asia/Ho_Chi_Minh | VND (đ) |
| USA | America/New_York | USD ($) |
| Europe | Europe/Paris | EUR (€) |
| UK | Europe/London | GBP (£) |
| Japan | Asia/Tokyo | JPY (¥) |
| Korea | Asia/Seoul | KRW (₩) |
| Singapore | Asia/Singapore | SGD (S$) |
| Thailand | Asia/Bangkok | THB (฿) |
| China | Asia/Shanghai | CNY (¥) |
| India | Asia/Kolkata | INR (₹) |
| UAE | Asia/Dubai | AED |
| Indonesia | Asia/Jakarta | IDR (Rp) |
| Australia | Australia/Sydney | AUD (A$) |

Note: Exchange rates are static approximations for display only. Actual transactions use VND (VietQR) or USD (Stripe).

---

## 13. Production Deployment

### Docker (recommended)
```bash
cp .env.example .env   # fill required vars
docker compose up -d
docker compose exec app node init-db.js
```

### Railway
```bash
npm install -g @railway/cli
railway login && railway init && railway up
# Add PostgreSQL plugin → DATABASE_URL auto-injected
```

### Render
New Web Service → Build: `npm install` → Start: `node server.js` → Add PostgreSQL.

### Ubuntu VPS
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql nginx

# Setup database
sudo -u postgres psql -c "CREATE DATABASE saleskit_pro;"

# Deploy app
git clone <your-repo> && cd saleskit-pro
npm install && cp .env.example .env   # edit .env
npm run init

# Start with PM2
pm2 start pm2.config.js
pm2 save && pm2 startup

# HTTPS (required for webhooks)
sudo certbot --nginx -d yourdomain.com
```

### Required Environment Variables
```env
# Required
JWT_SECRET=<openssl rand -hex 32>
SUPER_ADMIN_USER=platform_admin
SUPER_ADMIN_PASS=<strong password>
DATABASE_URL=postgresql://user:pass@host:5432/saleskit_pro

# Payments
PLATFORM_BANK_CODE=MB
PLATFORM_BANK_ACCOUNT=0123456789
PLATFORM_BANK_HOLDER=YOUR_NAME
BANK_WEBHOOK_SECRET=<random secret>
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx

# Security
CORS_ORIGINS=https://app.yourdomain.com

# Server
PORT=4000
NODE_ENV=production
```

> HTTPS is mandatory — Facebook, Zalo, and WhatsApp webhooks only accept HTTPS.

---

## 14. Keyboard Shortcuts (Dashboard)

| Shortcut | Action |
|---|---|
| `Ctrl + K` | Focus customer search |
| `Ctrl + D` | Go to Dashboard |
| `Ctrl + I` | Open Shared Inbox |
| `Ctrl + N` | Add new customer |
| `Escape` | Close all modals / mobile sidebar |

---

## 15. Security Architecture

| Layer | Implementation |
|---|---|
| Authentication | JWT tokens, 30-day expiry |
| Password hashing | bcryptjs, cost factor 10 |
| Login rate limiting | Progressive lockout: 3 failures → 2 min → 5 min → contact admin |
| Widget rate limiting | 60 messages/min per IP per shop — blocks bots |
| Registration limiting | 5 attempts/hour per IP |
| Security headers | X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
| Multi-tenant isolation | `shop_id` on every query — cross-tenant access architecturally impossible |
| JWT_SECRET enforcement | Server refuses to start if secret is missing |
| CORS | Configurable per-origin via `CORS_ORIGINS` env var |
| Bank webhook | Signature verification via `BANK_WEBHOOK_SECRET` |
| Stripe webhook | Signature verification via `stripe-signature` header |
| GDPR | Export + erasure endpoints included |

---

## 16. Performance Benchmarks

Measured on a developer laptop (not a production server):

| Metric | Result |
|---|---|
| Concurrent users (load test) | 300 |
| Total requests | 900 (300 users × 3 messages) |
| Success rate | **100%** |
| Throughput | **518 req/s** |
| P50 latency | 225 ms |
| P90 latency | 368 ms |
| P95 latency | 459 ms |
| P99 latency | 1,330 ms |
| DB pool size | 50 connections |
| Cache hit (shopByApiKey) | TTL 5 min — reduces ~70% of DB queries |

On a production VPS (4 CPU, 8 GB RAM), expect 3–5× better throughput.

---

## 17. Known Limitations

| Limitation | Notes |
|---|---|
| Product images stored as base64 in DB | Recommend migrating to S3/Cloudflare R2 for scale |
| Plan expiry not automated | Requires cron job or manual admin action |
| Inbox shows last 100 messages | Pagination not yet implemented for message history |
| Exchange rates are static | Not connected to live rate API — display only |
| Stripe subscriptions not supported | One-time payments only, no recurring billing |
| Socket.IO single-instance | Add `@socket.io/redis-adapter` + Redis for horizontal scaling |

---

## 18. Full Tech Stack

**Backend**

| Package | Version | Purpose |
|---|---|---|
| express | 4.19 | HTTP framework |
| pg | 8.21 | PostgreSQL client + connection pooling |
| socket.io | 4.8 | Real-time WebSocket |
| jsonwebtoken | 9.0 | JWT authentication |
| bcryptjs | 2.4 | Password hashing |
| express-rate-limit | 8.5 | Rate limiting |
| node-fetch | 3.3 | HTTP requests (Gemini API, channel APIs) |
| openai | 6.39 | OpenAI SDK |
| stripe | 22.2 | Stripe payment integration |
| cors | 2.8 | CORS middleware |

**Frontend**

| Library | Version | Purpose |
|---|---|---|
| Chart.js | 4.4 | Dashboard charts + conversion funnel |
| Socket.IO client | 4.7 | Real-time event reception |
| Google Fonts | — | Syne + DM Sans (lazy-loaded, system fallback) |

**Integrated Channels & Services**

| Service | API | Notes |
|---|---|---|
| Facebook Messenger | Meta Graph API v19 | Webhook verify + receive |
| Zalo OA | Zalo Open API v2 | Webhook receive |
| Telegram Bot | Telegram Bot API | Webhook receive + auto-register |
| WhatsApp Business | Meta WhatsApp Cloud API v19 | Webhook verify + receive |
| VietQR | vietqr.io | QR generation (no API key needed) |
| SePay / Casso | Bank webhook | Automatic payment confirmation |
| Stripe | Stripe Checkout API | International card payments |
| OpenAI | Chat Completions API | GPT-4o-mini |
| Google Gemini | generateContent API | Gemini 2.5 Flash |

---

*SalesKit Pro v3.1 — Multi-tenant SaaS · Node.js 20 · PostgreSQL 16 · 5 channels · Bilingual · Multi-currency*
