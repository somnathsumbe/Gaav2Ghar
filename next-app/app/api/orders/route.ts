import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

type OrderPayload = {
  customer?: { name?: string; phone?: string; address?: string };
  items?: Array<{ productId: string; product: string; variety: string; bagSizeKg: number; bags: number; quantityKg: number; pricePerKg: number }>;
  subtotal?: number;
  deliveryCharge?: number;
  total?: number;
  paymentMethod?: string;
};

function validOrder(body: OrderPayload) {
  const customer = body.customer;
  if (!customer?.name?.trim() || !customer.phone || !/^[6-9]\d{9}$/.test(customer.phone) || !customer.address?.trim()) return false;
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) return false;
  if (!body.items.every((item) => item.productId && item.product && item.variety && [5, 25, 50, 100].includes(item.bagSizeKg) && Number.isInteger(item.bags) && item.bags > 0 && item.bags <= 100 && Number.isFinite(item.pricePerKg) && item.pricePerKg > 0)) return false;
  return Number.isFinite(body.subtotal) && Number.isFinite(body.deliveryCharge) && Number.isFinite(body.total) && body.subtotal! >= 0 && body.deliveryCharge! >= 0 && body.total! >= 0;
}

export async function POST(request: Request) {
  let body: OrderPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "अवैध विनंती." }, { status: 400 });
  }
  if (!validOrder(body)) return NextResponse.json({ error: "कृपया ऑर्डरची माहिती तपासा." }, { status: 400 });

  const orderId = "G2G-" + Date.now().toString(36).toUpperCase();
  const order = {
    ...body,
    orderId,
    status: "pending_confirmation",
    createdAt: new Date(),
  };

  const uri = process.env.MONGODB_URI;
  if (uri) {
    let client: MongoClient | undefined;
    try {
      client = new MongoClient(uri);
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || "gaav2ghar");
      await db.collection("orders").insertOne(order);
    } catch (error) {
      console.error("Order persistence failed", error);
      return NextResponse.json({ error: "ऑर्डर सेव्ह झाली नाही. कृपया पुन्हा प्रयत्न करा." }, { status: 503 });
    } finally {
      await client?.close();
    }
  } else {
    console.warn("MONGODB_URI is not set; order accepted for demo only and is not persisted.", orderId);
  }

  return NextResponse.json({ ok: true, orderId, persisted: Boolean(uri) }, { status: 201 });
}
