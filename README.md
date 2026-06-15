# SalesKit Pro v3.0

> **Multi-tenant SaaS chatbot & CRM platform** — Deploy once, serve hundreds of online stores with isolated dashboards, AI chat, lead scoring, and built-in billing.

[![CI](https://github.com/your-org/saleskit-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/saleskit-pro/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Commercial-blue)](#license)

---

## ✨ Key Features

| Feature | Details |
|---|---|
| **5-Channel Chatbot** | Facebook Messenger, Zalo OA, Telegram, WhatsApp, Web Widget |
| **AI Reply Engine** | 4-tier pipeline: keyword rules → product match → OpenAI/Gemini → fallback |
| **Copilot AI** | Floating onboarding assistant with freemium upsell (7 free → paid subscription) |
| **CRM + Lead Scoring** | Auto-score customers by behavior; Kanban board (New/Hot/Close/Cold) |
| **Sentiment Analysis** | Real-time bilingual (EN + VI) classification: angry / buy intent / happy / neutral |
| **Orders (POS)** | Full order management with status tracking |
| **Broadcast** | Bulk messaging to customer segments |
| **Billing** | Built-in subscription plans (Free/Basic/Pro/Enterprise) via VietQR + Stripe |
| **Multi-tenant** | 100% shop data isolation at query level (shop_id on every table) |
| **Super Admin** | Platform-wide management, plan pricing, shop approval |
| **GDPR Ready** | Data export + erasure endpoints |
| **Real-time** | Socket.IO — live inbox, customer status, lead events |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   SalesKit Pro                      │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Shop A   │  │ Shop B   │  │   Super Admin    │  │
│  │Dashboard │  │Dashboard │  │    Platform      │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       └─────────────┴──────────────────┘            │
│                     │                               │
│         ┌───────────▼────────────┐                  │
│         │   Express + Socket.IO  │                  │
│         │   Node.js Backend      │                  │
│         └───────────┬────────────┘                  │
│                     │                               │
│         ┌───────────▼────────────┐                  │
│         │   PostgreSQL (pool=50) │                  │
│         │   TTL In-Memory Cache  │                  │
│         └────────────────────────┘                  │
└─────────────────────────────────────────────────────┘

Channels: FB Messenger │ Zalo OA │ Telegram │ WhatsApp │ Web Widget
AI:       OpenAI GPT-4o-mini  │  Google Gemini 2.5 Flash
Payments: VietQR │ Stripe │ PayPal/Wise (feature-flagged)
```

---

## 🚀 Quick Start

### Option A — Docker (recommended)

```bash
# 1. Clone and copy env
git clone https://github.com/your-org/saleskit-pro.git
cd saleskit-pro
cp .env.example .env
# → Edit .env: set JWT_SECRET, SUPER_ADMIN_USER, SUPER_ADMIN_PASS

# 2. Start everything (app + PostgreSQL)
docker compose up -d

# 3. Initialize database + demo shop
docker compose exec app node init-db.js

# 4. Open dashboard
open http://localhost:4000/app
# Login: shopId=demo-shop  user=admin  pass=1234
```

### Option B — Manual (Node.js + PostgreSQL)

```bash
# Requirements: Node.js >= 18, PostgreSQL >= 14

npm install
cp .env.example .env   # fill in required vars

npm run init           # create schema + demo shop
npm start              # start server on port 4000
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Min 32 chars. Generate: `openssl rand -hex 32` |
| `SUPER_ADMIN_USER` | ✅ | Platform owner login |
| `SUPER_ADMIN_PASS` | ✅ | Platform owner password |
| `DATABASE_URL` | ✅* | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | ☑️ | International card payments |
| `BANK_WEBHOOK_SECRET` | ☑️ | VietQR bank webhook verification |
| `CORS_ORIGINS` | ☑️ | Comma-separated allowed origins for Socket.IO |
| `PORT` | — | Default `4000` |

*Or use `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS` separately.

---

## 📡 API Overview

### Public (no auth)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/widget/:apiKey/config.js` | Load chatbot widget config (cached 2 min) |
| `POST` | `/widget/:apiKey/reply` | Send customer message, get bot reply (rate-limited: 60/min) |
| `GET` | `/health` | Health check `{ status, shops }` |

### Shop (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login → JWT |
| `GET` | `/api/customers?page=1&limit=50&status=hot&search=` | List customers (paginated) |
| `GET` | `/api/inbox` | Unified inbox (all channels) |
| `GET` | `/api/products` | Product catalog |
| `GET` | `/api/stats` | Dashboard stats |
| `GET` | `/api/leads` | Lead scoring events |
| `GET` | `/api/reports/funnel` | Conversion funnel |
| `POST` | `/api/broadcast` | Send bulk messages |
| `GET` | `/api/orders` | Order list |

### Super Admin (super JWT required)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/super/login` | Super admin login |
| `GET` | `/api/super/shops` | All shops |
| `PUT` | `/api/super/shops/:id/plan` | Change shop plan |
| `GET` | `/api/super/stats` | Platform-wide stats |

---

## 🧪 Testing

```bash
npm test   # 14 unit tests — sentiment analysis + lead scoring (no DB needed)
```

All tests run on Node.js built-in test runner — no extra packages required.

---

## 🔒 Security

- JWT authentication (30-day tokens) on all private routes
- Progressive login lockout per IP+shopId (2m → 5m → contact admin)
- Rate limiting: registration (5/hr), widget replies (60/min per IP per shop)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- `shop_id` isolation on every DB query — cross-shop data access is impossible at query level
- GDPR: `/api/gdpr/export` and `/api/gdpr/erase` endpoints

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Database | PostgreSQL 16 + `pg` (pool=50) |
| Real-time | Socket.IO 4 |
| AI | OpenAI API / Google Gemini API |
| Payments | Stripe SDK + VietQR webhook |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Tests | Node.js built-in test runner |
| Deploy | Docker / Railway / Render / PM2 |

---

## 🐳 Production Deployment

### Railway (easiest)
```bash
railway up
railway run node init-db.js
```

### Render
1. Connect GitHub repo → **New Web Service**
2. Build: `npm install` | Start: `node server.js`
3. Add environment variables in dashboard
4. Add PostgreSQL database → copy `DATABASE_URL`

### Self-hosted with PM2
```bash
npm install -g pm2
pm2 start pm2.config.js
pm2 save && pm2 startup
```

---

## 🗺️ Roadmap (for buyers)

- [ ] S3/Cloudflare R2 image storage (replace base64 in DB)
- [ ] Redis adapter for Socket.IO horizontal scaling
- [ ] REST API webhooks for outgoing events
- [ ] Mobile app (React Native)
- [ ] WhatsApp Cloud API official integration

---

## 📄 License

Commercial license — source code transfer. Buyer receives full ownership.
See `LICENSE` file for terms.

---

## 🙋 Support

Included with purchase: 30-day email support for setup questions.
