# Enabling AI for Your Chatbot (OpenAI / Google Gemini)

**Goal:** when a customer asks something not covered by your keyword rules, the bot replies naturally using AI.

---

## Option 1: Google Gemini — FREE tier available (recommended for new users)

### Get your API key
1. Go to **aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **Create API key** → **Create API key in new project**
4. Copy the string starting with **`AIza...`**

### Configure in the dashboard
1. Go to **AI Agent Config**
2. **AI Provider**: select **Google Gemini**
3. **Model**: select **gemini-2.5-flash** (free, fast). Note: gemini-1.5 has been deprecated by Google.
4. **API Key**: paste your `AIza...` key
5. Check **Enable AI Agent** → click **Save**
6. Click **Test AI** → type a question → verify the bot responds

---

## Option 2: OpenAI (higher quality, pay-per-use)

### Get your API key
1. Go to **platform.openai.com** → sign up
2. Add a payment method at **platform.openai.com/account/billing** (OpenAI requires a balance to make API calls)
3. Go to **platform.openai.com/api-keys** → **Create new secret key** → copy the **`sk-...`** string (only shown once — save it immediately)

### Configure in the dashboard
1. **AI Agent Config** → Provider: **OpenAI**
2. Model: **gpt-4o-mini** (affordable, fast — great for sales conversations)
3. Paste `sk-...` key → check **Enable AI Agent** → **Save** → **Test AI**

---

## System Prompt (optional — teach the bot how to talk)
- Leave blank: bot automatically uses your shop info + product catalog.
- Or write a custom persona, for example:
  *"You are a friendly sales assistant for Shop ABC, specializing in athletic footwear. Always suggest 1–2 relevant products and ask about size and color. Keep replies short and conversational."*

## Important notes
- Try **Gemini Flash** first — it's free.
- The bot still works with keyword rules even without AI enabled; AI only handles questions outside your scripts.
- Add products to the Products page first — AI needs product data to give accurate recommendations.
- API keys are stored encrypted; only the last 4 characters are shown in the UI.

## Troubleshooting
- **Wrong key** → check you copied the complete key without extra spaces
- **OpenAI quota error** → add funds to your OpenAI account balance
- **Gemini quota exceeded** → wait a few minutes or create a new key in Google AI Studio
