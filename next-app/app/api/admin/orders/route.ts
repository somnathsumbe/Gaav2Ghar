import { NextResponse } from "next/server";
import { MongoClient, type Document } from "mongodb";
import { ADMIN_COOKIE_NAME, isAdminConfigured, isValidAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredOrder = Document & { orderId: string; statusHistory?: Array<{ status: string; changedAt: Date }> };

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
    const result = await db.collection<StoredOrder>("orders").updateOne(
      { orderId: body.orderId },
      {
        $set: { status: body.status, updatedAt: new Date() },
        $push: { statusHistory: { status: body.status, changedAt: new Date() } },
      },
    );
    if (result.matchedCount === 0) return NextResponse.json({ error: "या order ID ची ऑर्डर सापडली नाही." }, { status: 404 });
    return NextResponse.json({ ok: true, orderId: body.orderId, status: body.status });
  } catch (error) {
    console.error("Admin order update failed", error);
    return NextResponse.json({ error: "Order status बदलता आला नाही. Database तपासा." }, { status: 503 });
  } finally {
    await client?.close();
  }
}
