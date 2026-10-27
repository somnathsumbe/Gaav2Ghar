# Gaav2Ghar — Next.js storefront

A separate Next.js app for the Gaav2Ghar grain delivery experience. The existing repository root (Vite app) is preserved.

## Run locally
1. `cd next-app`
2. `npm install`
3. Copy `.env.example` to `.env.local` and set `MONGODB_URI` if you want MongoDB-backed order storage.
4. `npm run dev` and open http://localhost:3000

## Included
- Mobile-first grain storefront with variety and bag-size selection
- Basket quantity controls and estimated checkout total
- Order API with optional MongoDB Atlas storage
- Admin-friendly foundation for future order management

## Important
Prices and delivery charges shown are demo values. Update them before taking real orders. Never commit real database credentials to GitHub.
