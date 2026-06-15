# SalesKit Pro — User Guide

> For shop owners and staff using the SalesKit Pro dashboard.
> Follow the 4-step quick start to get your chatbot live in under 10 minutes.

---

## Quick Start (4 Steps)

1. **Add products** (Products page) — gives the bot something to recommend
2. **Create auto-reply rules** (Auto Reply Rules) — price, shipping, warranty answers
3. **Enable AI** (AI Agent Config) — so the bot handles unexpected questions naturally
4. **Connect a channel** (Channel Settings) or **embed the widget** on your website

---

## Dashboard Overview

| Section | What it does |
|---|---|
| **Dashboard** | Summary stats — customers, messages, revenue, sentiment |
| **Customers / Kanban / Lead Scoring** | Manage and nurture your customer relationships |
| **Shared Inbox** | Reply to messages from all channels in one place |
| **Bot Preview / Auto Reply Rules / AI Config** | Configure chatbot behavior |
| **Embed Widget / Channel Settings** | Connect bot to your website and social channels |
| **Billing & Plans** | Upgrade your subscription |

---

## Products

### Why add products?
The bot uses your product catalog to answer price and availability questions — both in keyword rules and AI mode.

### How to add products
1. Go to **Products** page → click **Add Product**
2. Fill in: name, price, short description, emoji/icon, badge (hot/new)
3. Save

**Pro tip:** Add your 3–5 best-selling products first. The bot can recommend them immediately.

**Template variables** you can use in reply rules:
- `{product_name}` → replaced with first product name
- `{product_price}` → replaced with first product price
- `{product_list}` → shows up to 5 products (emoji + name + price)

---

## Auto Reply Rules

### How the bot decides what to reply
Priority order: **Keyword rules** → **Product name match** → **AI** (if enabled) → Default greeting

### Creating a keyword rule
1. Go to **Auto Reply Rules** → click **Add Rule**
2. **Keyword field:** enter words customers typically ask, separated by `|`
   - Example: `price|how much|cost`
3. **Reply field:** what the bot sends. You can use template variables.
4. Save. When a customer message contains the keyword, the bot replies with this text.

### Suggested starter rules
| Keyword | Example reply |
|---|---|
| `price\|how much\|cost` | "Our {product_name} is {product_price}. Want to order now? 😊" |
| `in stock\|available` | "Yes, we have it in stock! Ready to ship today. Want to order?" |
| `shipping\|delivery` | "🚀 We ship nationwide! Same-day in the city, 1–3 days nationwide. Free shipping over $50!" |
| `warranty\|guarantee` | "🛡️ 12-month warranty, 1-for-1 replacement. Shop with confidence!" |
| `payment\|pay` | "💳 We accept: Bank transfer, COD, credit card, PayPal." |

---

## AI Agent Configuration

When customers ask something not covered by your keyword rules, the AI takes over and responds naturally.

### Option 1 — Google Gemini (Free tier available — recommended for beginners)

**Get your API key:**
1. Go to **aistudio.google.com/app/apikey**
2. Log in with your Google account
3. Click **Create API key** → **Create API key in new project**
4. Copy the string starting with `AIza...`

**Configure in dashboard:**
1. Go to **AI Agent Config**
2. AI Provider: **Google Gemini**
3. Model: **gemini-2.5-flash** (free, fast)
4. Paste your `AIza...` key
5. Check **Enable AI Agent** → click **Save**
6. Click **Test AI** to verify it works

### Option 2 — OpenAI (Higher quality, pay-per-use)

**Get your API key:**
1. Go to **platform.openai.com** → sign up
2. Add a payment method at **platform.openai.com/account/billing**
3. Go to **platform.openai.com/api-keys** → **Create new secret key**
4. Copy the `sk-...` string (shown only once — save it immediately)

**Configure in dashboard:**
1. AI Agent Config → Provider: **OpenAI**
2. Model: **gpt-4o-mini** (affordable, fast — great for sales chat)
3. Paste your `sk-...` key → Enable → Save → Test

### System Prompt (optional)
Leave blank to use the default (bot uses your shop name + product list automatically).

Or write a custom persona:
> *"You are a friendly sales assistant for [Shop Name], specializing in athletic footwear. Always suggest 1–2 relevant products and ask about size and color preference. Keep replies short and conversational."*

### Troubleshooting
- **Wrong key** → double-check you copied the complete key
- **OpenAI quota error** → add funds to your OpenAI account
- **Gemini quota** → wait a few minutes or create a new key

---

## Shared Inbox

All messages from every channel (Web, Facebook, Zalo, Telegram, WhatsApp) arrive in one place. Staff reply from here — no need to switch apps.

### How to use
1. Go to **Shared Inbox**
2. Left panel: list of conversations (unread indicators shown)
3. Click a conversation to view it
4. Type in the reply box → Send. Message is delivered to the customer's original channel.
5. Optionally link a conversation to a CRM customer profile to save history.

### Test without real channels
Click **Simulate Tool** → choose channel → type message → Send. Creates a simulated message so you can test the full receive-and-reply flow and see real-time notifications — no real account needed.

### Tips
- Each message shows a sentiment tag: 😡 Angry / 🔥 Buying Intent / 😊 Happy / 🤔 Questioning
- Use these to prioritize which conversations to handle first
- Keyboard shortcut: **Ctrl+I** to open Inbox quickly

---

## CRM — Customer Management

### Customer list
- **Customers** page: view, search, filter, export CSV
- Click **Add Customer** to create a record manually (name, phone, source, product interest)
- Bulk status change or delete supported

### Kanban Board
- Drag-and-drop interface with 4 columns: **New → Hot → Close → Cold**
- Each drag action is recorded in the customer's activity timeline
- Keyboard shortcut: **Ctrl+K** to search customers

### Lead Scoring
The system automatically scores customers based on their messages:

| Action | Points |
|---|---|
| Any message | +5 |
| Asks about price | +15 |
| Shows purchase intent | +25 |
| Provides phone number | +20 |
| Asks about shipping | +10 |
| Asks about location | +10 |
| Browses products | +8 |

**Auto-promotion:**
- Score ≥ 80 → status changes from **New** to **Hot**
- Score ≥ 150 → status changes from **Hot** to **Close**

### Customer Timeline
Click any customer to see their full history: all messages, score events, staff actions — everything in chronological order.

---

## Embedding the Widget on Your Website

1. Go to **Embed Widget** page
2. Click **Copy embed code** (a `<script>` snippet)
3. Paste it just before the `</body>` tag on your website
   - WordPress / Shopify / Haravan: find "Custom code" or "Footer script" setting
4. Reload your website — the chat widget appears in the bottom-right corner

### Customize the widget
Go to **Bot Preview** to change: bot name, color, greeting message, quick-reply buttons. Changes apply to the live widget immediately after saving.

**Note:** The web widget works independently — you don't need Facebook or Zalo connected for it to work.

---

## Connecting Social Channels

### Telegram (easiest — try this first)
1. Open Telegram → search **@BotFather** → type `/newbot` → follow prompts → copy **Bot Token** (`123456:ABC...`)
2. Dashboard → **Channel Settings** → Telegram tab → paste token → Save
3. Click **Auto-register Webhook** — done. Test by messaging your bot on Telegram.

### Facebook Messenger
1. **developers.facebook.com** → Create App → Add Messenger product
2. Link your Facebook Page → generate **Page Access Token**
3. Dashboard → Channels → Facebook → paste token + set a verify token → Save
4. Back in Facebook: set Webhook URL to `https://your-domain.com/webhook/<API_KEY>/facebook`
5. Set Verify Token to match what you entered in step 3
6. Subscribe to: `messages`

### Zalo Official Account
1. Requires a Zalo Official Account (`oa.zalo.me`)
2. Get **OA Access Token** from Zalo developers portal
3. Dashboard → Channels → Zalo → paste token → Save
4. Set webhook at Zalo: `https://your-domain.com/webhook/<API_KEY>/zalo`, enable `user_send_text`

### WhatsApp Business
1. **developers.facebook.com** → App → WhatsApp → API Setup
2. Get **Access Token** (System User) + **Phone Number ID**
3. Dashboard → Channels → WhatsApp → fill all fields → Save
4. Webhook URL: `https://your-domain.com/webhook/<API_KEY>/whatsapp`

**Important:** ngrok (free plan) changes URL on every restart. If you're testing locally, you'll need to update webhook URLs each time.

---

## Billing & Plans

### Upgrade your plan
1. Go to **Billing & Plans**
2. Choose a plan → click **Pay via Bank Transfer (VND)** or **Pay with Stripe (USD)**
3. Complete payment → plan activates automatically

| Plan | Price | Customers | Products | Rules |
|---|---|---|---|---|
| Free | $0 | 100 | 10 | 5 |
| Basic | $12/mo | 500 | 50 | 30 |
| Pro | $28/mo | 5,000 | 200 | 100 |
| Enterprise | $80/mo | Unlimited | Unlimited | Unlimited |

### Payment options
- **VietQR (VND):** scan QR code with your banking app — plan activates automatically after confirmed
- **Stripe (USD):** pay with Visa/Mastercard via Stripe Checkout
- **International transfer:** PayPal / Wise — contact support with transfer reference to activate

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` | Search customers |
| `Ctrl + D` | Go to Dashboard |
| `Ctrl + I` | Open Shared Inbox |
| `Ctrl + N` | Add new customer |
| `Escape` | Close modal / sidebar |

---

*Questions? Ask the Copilot AI assistant (robot icon in the corner of your dashboard) — it knows this platform inside out.*
