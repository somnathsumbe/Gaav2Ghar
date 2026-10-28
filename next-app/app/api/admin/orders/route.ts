import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { ADMIN_COOKIE_NAME, isAdminConfigured, isValidAdminSession } from "@/lib/admin-auth";
import { sendWhatsAppStatusUpdate } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = [
  "pending_confirmation",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

function authorized(request: Request) {
  if (!isAdminConfigured()) return false;
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(ADMIN_COOKIE_NAME + "="));
  return isValidAdminSession(cookie ? decodeURIComponent(cookie.slice(ADMIN_COOKIE_NAME.length + 1)) : undefined);
}

function databaseUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Database is not configured.");
  return uri;
}

export async function GET(request: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ error: "Admin login is not configured." }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let client: MongoClient | undefined;
  try {
    client = new MongoClient(databaseUri(), { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "gaav2ghar");
    const orders = await db.collection("orders")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("Admin order list failed", error);
    return NextResponse.json({ error: "ऑर्डर्स लोड करता आले नाहीत. Database configuration तपासा." }, { status: 503 });
  } finally {
    await client?.close();
  }
}

export async function PATCH(request: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ error: "Admin login is not configured." }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { orderId?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.orderId !== "string" || body.orderId.length < 4 || body.orderId.length > 100) {
    return NextResponse.json({ error: "योग्य order ID द्या." }, { status: 400 });
  }
  if (typeof body.status !== "string" || !STATUSES.includes(body.status as (typeof STATUSES)[number])) {
    return NextResponse.json({ error: "अवैध order status." }, { status: 400 });
  }

  let client: MongoClient | undefined;
  try {
    client = new MongoClient(databaseUri(), { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "gaav2ghar");
    const orders = db.collection("orders");
    const existing = await orders.findOne({ orderId: body.orderId }, {
      projection: { _id: 0, orderId: 1, status: 1, customer: 1 },
    });
    if (!existing) return NextResponse.json({ error: "या order ID ची ऑर्डर सापडली नाही." }, { status: 404 });

    if (existing.status === body.status) {
      return NextResponse.json({
        ok: true,
        orderId: body.orderId,
        status: body.status,
        notification: { state: "not_sent", reason: "status_unchanged" },
      });
    }

    const changedAt = new Date();
    const result = await orders.updateOne(
      { orderId: body.orderId },
      {
        $set: { status: body.status, updatedAt: changedAt },
        $push: { statusHistory: { status: body.status, changedAt } },
      } as any,
    );
    if (result.matchedCount === 0) return NextResponse.json({ error: "या order ID ची ऑर्डर सापडली नाही." }, { status: 404 });

    let notification: { state: string; messageId?: string; errorCode?: string; reason?: string };
    const customer = existing.customer as { name?: string; phone?: string; whatsappOptIn?: boolean } | undefined;
    if (customer?.whatsappOptIn !== true) {
      notification = { state: "skipped_opt_out", reason: "customer_has_not_opted_in" };
    } else if (!customer.phone) {
      notification = { state: "failed", errorCode: "MISSING_PHONE" };
    } else {
      const sendResult = await sendWhatsAppStatusUpdate({
        phone: customer.phone,
        customerName: customer.name || "Customer",
        orderId: String(body.orderId),
        status: String(body.status),
      });
      notification = {
        state: sendResult.state,
        ...("messageId" in sendResult && sendResult.messageId ? { messageId: sendResult.messageId } : {}),
        ...("errorCode" in sendResult && sendResult.errorCode ? { errorCode: sendResult.errorCode } : {}),
      };
    }

    await orders.updateOne(
      { orderId: body.orderId },
      { $push: { notificationHistory: { channel: "whatsapp", status: body.status, ...notification, attemptedAt: new Date() } } } as any,
    );
    return NextResponse.json({ ok: true, orderId: body.orderId, status: body.status, notification });
  } catch (error) {
    console.error("Admin order update failed", error);
    return NextResponse.json({ error: "Order status बदलता आला नाही. Database तपासा." }, { status: 503 });
  } finally {
    await client?.close();
  }
}
