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

Redeploy after changing environment variables. Do not commit `.env.local` or real credentials.

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
