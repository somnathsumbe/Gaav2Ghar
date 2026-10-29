# Gaav2Ghar Admin & Order Tracking Setup

## Local development
1. Copy `env.example` to `.env.local` inside `next-app`.
2. Fill in `MONGODB_URI` and `MONGODB_DB=gaav2ghar`.
3. Set a strong unique `ADMIN_PASSWORD`.
4. Set `ADMIN_SESSION_SECRET` to a random secret with at least 32 characters (for example, generate it with `openssl rand -base64 48`).
5. Run `npm install` and `npm run dev` from `next-app`.
6. Open `http://localhost:3000/admin`. Customer tracking is at `http://localhost:3000/track`.

## Vercel
Add these Environment Variables in the Vercel project settings for Preview and Production:
- `MONGODB_URI`: MongoDB Atlas connection string. Never put it in source code.
- `MONGODB_DB`: `gaav2ghar` (must match the database containing the existing orders).
- `ADMIN_PASSWORD`: a long, unique admin password.
- `ADMIN_SESSION_SECRET`: a random secret of at least 32 characters; do not reuse the admin password.
- `WHATSAPP_ACCESS_TOKEN`: Meta WhatsApp Cloud API access token (encrypted Vercel variable; never commit it).
- `WHATSAPP_PHONE_NUMBER_ID`: the registered WhatsApp Business phone-number ID from Meta.
- `WHATSAPP_API_VERSION`: a currently supported Graph API version, for example the version shown in your Meta app's API setup.
- `WHATSAPP_TEMPLATE_NAME`: the exact approved status template name, e.g. `gaav2ghar_order_status`.
- `WHATSAPP_TEMPLATE_LANGUAGE`: the approved template language code, e.g. `en_US`.

### WhatsApp template setup (required before automatic messages work)
1. Set up a Meta business portfolio, WhatsApp Business Account, and a registered business phone number in the official WhatsApp Cloud API.
2. Create and get approval for a **Utility** template in WhatsApp Manager using the same language as `WHATSAPP_TEMPLATE_LANGUAGE`.
3. The code sends three body parameters in this order: customer name (`{{1}}`), order ID (`{{2}}`), and new status (`{{3}}`). Example English body: `Hello {{1}}, your Gaav2Ghar order {{2}} status is now {{3}}.`
4. Set all five WhatsApp environment variables in Vercel Preview and Production, then redeploy. Use a long-lived/system-user token with the required `whatsapp_business_messaging` permission and follow Meta's current rules.
5. Customers must explicitly opt in at checkout. The app skips notifications when the checkbox was not selected.
6. The admin status update remains saved even if WhatsApp is not configured or the API call fails. Admin feedback and `notificationHistory` record the result. An `accepted` result means Meta accepted the API request, not proof that the recipient's device delivered/read the message; delivery receipts require a configured WhatsApp webhook.

Never paste access tokens into chat or commit them to GitHub. The GPS button uses browser permission on HTTPS; customers can still place an order with a manually entered address if they decline GPS.

## Routes
- `POST /api/admin/login`: validates admin password and sets an HttpOnly, SameSite=Strict signed session cookie.
- `POST /api/admin/logout`: clears the admin cookie.
- `GET /api/admin/orders`: returns the newest 200 orders; requires a valid admin session.
- `PATCH /api/admin/orders`: updates order status; requires a valid admin session.
- `GET /api/orders/track?orderId=...&phone=...`: verifies order ID and the order's registered phone before returning limited tracking details.

Supported statuses: `pending_confirmation`, `confirmed`, `packed`, `out_for_delivery`, `delivered`, `cancelled`.

## Product catalogue
- The public `GET /api/products` endpoint safely seeds missing starter products into the `products` collection using upserts that do not overwrite existing records.
- The customer page reads its catalogue from MongoDB.
- Open `/admin/products` to update prices, varieties, descriptions, and availability.
- Bajri, Moong, and Onions start with `pricePerKg: 0` intentionally. Set their actual selling prices in Admin before accepting orders; zero-priced products cannot be added to the basket.
- Confirm the existing wheat, rice, jowar, and toor dal prices against your actual business prices before launch.
