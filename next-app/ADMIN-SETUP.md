# Gaav2Ghar Admin, Delivery & Notifications Setup

## Environment variables
Set these in Vercel Preview and Production, then redeploy:
- `MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (existing app requirements).
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE` (optional official WhatsApp Cloud API integration).

Never commit real credentials or paste access tokens into chat.

## WhatsApp template
Create and get approval for a Utility template in WhatsApp Manager using the same language as `WHATSAPP_TEMPLATE_LANGUAGE`. The app sends three body parameters in order: customer name (`{{1}}`), order ID (`{{2}}`), and status (`{{3}}`). Customers must explicitly opt in at checkout. An `accepted` API result means Meta accepted the request, not that the message was delivered or read; delivery receipts require a webhook.

Status changes are persisted before the notification attempt. Notifications are skipped for customers who have not opted in, and the result is recorded in `notificationHistory`. Unconfigured WhatsApp credentials do not block order status changes.

## Delivery GPS
Order payloads can include validated `customer.location` coordinates (latitude, longitude, optional accuracy). GPS is optional; manual address remains required and is the fallback when browser location permission is unavailable.

## Routes
- `POST /api/orders`: persists orders in MongoDB.
- `GET /api/admin/orders`: lists recent orders (admin session required).
- `PATCH /api/admin/orders`: updates status and attempts opted-in WhatsApp notification (admin session required).
- `GET /api/orders/track?orderId=...&phone=...`: customer order tracking.
