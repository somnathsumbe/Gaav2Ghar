import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = (url.searchParams.get("orderId") || "").trim().toUpperCase();
  const phone = (url.searchParams.get("phone") || "").replace(/\D/g, "");
  const hasOrderId = Boolean(orderId);
  const hasPhone = Boolean(phone);

  if ((!hasOrderId && !hasPhone) ||
      (hasOrderId && !/^G2G-[A-Z0-9-]{4,80}$/.test(orderId)) ||
      (hasPhone && !/^[6-9]\d{9}$/.test(phone))) {
    return NextResponse.json({ error: "नोंदणीकृत 10 अंकी मोबाईल नंबर किंवा योग्य ऑर्डर ID टाका." }, { status: 400 });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "Database configured नाही." }, { status: 503 });

  let client: MongoClient | undefined;
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "gaav2ghar");
    const collection = db.collection("orders");
    const projection = { _id: 0, orderId: 1, status: 1, createdAt: 1, updatedAt: 1, "customer.name": 1 };

    // An Order ID returns only its matching order and its current/final status.
    if (hasOrderId) {
      const filter = hasPhone
        ? { orderId, "customer.phone": phone }
        : { orderId };
      const order = await collection.findOne(filter, { projection });
      if (!order) return NextResponse.json({ error: "या माहितीनुसार ऑर्डर सापडली नाही. तपशील तपासा." }, { status: 404 });
      return NextResponse.json({ ok: true, order });
    }

    // Normalize phone values in MongoDB so legacy values with +91, spaces or
    // punctuation are matched too. Keep every order except delivered ones.
    const orders = await collection.aggregate([
      {
        $addFields: {
          _trackingPhone: {
            $regexReplace: {
              input: {
                $toString: {
                  $ifNull: ["$customer.phone", { $ifNull: ["$customer.mobile", "$phone"] }],
                },
              },
              regex: "[^0-9]",
              replacement: "",
            },
          },
          _trackingStatus: {
            $toLower: { $ifNull: ["$status", "pending_confirmation"] },
          },
        },
      },
      { $match: { _trackingPhone: { $regex: phone + "$" }, _trackingStatus: { $ne: "delivered" } } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 0,
          orderId: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          "customer.name": 1,
        },
      },
    ]).toArray();

    if (!orders.length) {
      return NextResponse.json({ error: "या मोबाईल नंबरवर कोणतीही सुरू असलेली ऑर्डर सापडली नाही." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, orders, count: orders.length });
  } catch (error) {
    console.error("Order tracking lookup failed", error);
    return NextResponse.json({ error: "Tracking माहिती मिळवता आली नाही." }, { status: 503 });
  } finally {
    await client?.close();
  }
}
