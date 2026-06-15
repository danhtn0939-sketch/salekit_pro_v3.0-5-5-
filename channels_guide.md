# Auto Reply Rules & Bot Preview

## How the bot decides what to reply
Priority order: **Keywords** → **Product name match** → **AI** (if enabled) → Default greeting.

## Creating keyword rules (Auto Reply Rules)
1. Go to **Auto Reply Rules** → click Add Rule.
2. **Keyword field:** enter words customers typically ask, separated by `|`.
   Example: `price|how much|cost`
3. **Reply field:** what the bot sends. Supports variables: `{product_name}`, `{product_price}`, `{product_list}`.
4. Save. When a customer message contains the keyword, the bot replies with this text.

## Bot Preview
- **Bot Preview** page: chat with the bot live, and customize the widget's name, color, and greeting.

## Tips
- Create starter rules for: price, in stock, shipping, warranty, payment methods.
- Enable AI (AI Agent Config page) so the bot can also handle questions outside your keyword scripts.
