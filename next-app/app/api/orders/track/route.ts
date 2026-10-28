import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = (url.searchParams.get("orderId") || "").trim();
  const phone = (url.searchParams.get("phone") || "").replace(/\D/g, "");
  if (!/^G2G-[A-Z0-9-]{4,80}$/.test(orderId) || !/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "योग्य order ID आणि नोंदणीकृत 10 अंकी मोबाईल नंबर टाका." }, { status: 400 });
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "Database configured नाही." }, { status: 503 });

  let client: MongoClient | undefined;
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "gaav2ghar");
    const order = await db.collection("orders").findOne(
      { orderId, "customer.phone": phone },
      { projection: { _id: 0, orderId: 1, status: 1, createdAt: 1, updatedAt: 1, items: 1, total: 1 } },
    );
    if (!order) return NextResponse.json({ error: "ऑर्डर सापडली नाही. Order ID आणि मोबाईल नंबर तपासा." }, { status: 404 });
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error("Order tracking lookup failed", error);
    return NextResponse.json({ error: "Tracking माहिती मिळवता आली नाही." }, { status: 503 });
  } finally {
    await client?.close();
  }
}
