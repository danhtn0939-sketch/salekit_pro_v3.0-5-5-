# Connecting Channels (Facebook / Zalo / Telegram / WhatsApp)

**Goal:** let the chatbot automatically reply to customers on social media channels.

## Quick background
- Facebook/Zalo require a public URL to deliver messages to your software. If running locally (localhost), use **ngrok** (free) to create a temporary public URL.
- "Token" = a key that lets the software send/receive messages on your behalf.
- "Webhook" = a URL where the social platform forwards incoming customer messages.

---

## A. TELEGRAM (easiest — try this first)
1. Open Telegram → search **@BotFather** → type `/newbot` → follow prompts → copy **Bot Token** (format: `123456:ABC...`)
2. Dashboard → **Channel Settings** → Telegram tab → paste token → Save
3. Click the **Auto-register Webhook** button — done instantly
4. Message your bot on Telegram to test

---

## B. FACEBOOK MESSENGER (step-by-step)

### Step 1 — Create a public URL with ngrok (if running locally)
1. Go to **ngrok.com** → sign up for free
2. Download ngrok, unzip it
3. Get your authtoken at `dashboard.ngrok.com/get-started/your-authtoken` → run: `ngrok config add-authtoken <your_token>`
4. Run: `ngrok http 4000`
5. Copy the **Forwarding** URL (format: `https://abc123.ngrok-free.app`)

### Step 2 — Create a Facebook App
1. Go to **developers.facebook.com** → **My Apps** → **Create App**
2. Choose type **Business** → name your app → create
3. Inside the app, find **Messenger** → click **Set up**

### Step 3 — Get a Page Access Token
1. Messenger → **Generate Token** → select your Facebook Page
2. Grant permissions → copy the **Page Access Token** (long string)
3. Dashboard → **Channel Settings** → Facebook tab → paste into **Page Access Token** field

### Step 4 — Set a Verify Token
1. Create any string you like, e.g. `myshop2024abc`
2. Paste it into the **Verify Token** field in the dashboard (remember it for the next step)

### Step 5 — Register Webhook in Facebook
1. Copy the **Webhook URL** from the dashboard (format: `https://<ngrok-url>/webhook/<api_key>/facebook`)
2. In Facebook → Messenger → **Webhooks** → **Add Callback URL**:
   - Callback URL: paste your Webhook URL
   - Verify Token: paste the string from Step 4
   - Click **Verify and Save**
3. Click **Add Subscriptions** → check **messages** and **messaging_postbacks**

### Step 6 — Save & test
1. Back in dashboard → click **Save FB Config**
2. Send a test message to your Facebook Page → the bot should reply. Message also appears in **Shared Inbox**.

### Troubleshooting
- Check **ngrok is still running** (stopping ngrok breaks the connection)
- Verify the Page Access Token is pasted completely
- The Verify Token in Facebook must match exactly what's in the dashboard

---

## C. ZALO OFFICIAL ACCOUNT
1. Requires a **Zalo Official Account** (create at `oa.zalo.me`)
2. Get **OA Access Token** from the Zalo developer portal
3. Dashboard → Channel Settings → Zalo → paste token → Save
4. Register webhook at Zalo: `https://your-backend.com/webhook/<api_key>/zalo`, enable `user_send_text` event

---

## D. WHATSAPP BUSINESS
1. **developers.facebook.com** → App → WhatsApp → API Setup
2. Get **Access Token** (System User Token) + **Phone Number ID**
3. Dashboard → Channel Settings → WhatsApp → fill all fields → Save
4. Webhook URL: `https://your-backend.com/webhook/<api_key>/whatsapp`, subscribe to `messages`

---

## Testing without a real channel
Go to **Shared Inbox → Simulate Tool** → choose any channel (Facebook/Zalo/Web) → type a message → Send. The bot replies immediately — no real accounts needed. Great for testing before going live.

## Tips
- Start with **Telegram** — it's the simplest setup, then move to Facebook
- ngrok free plan changes its URL every restart — if the URL changes, you must re-register your Webhook URLs in each platform
