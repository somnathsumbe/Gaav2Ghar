import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

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

  try {
    const db = await getDatabase();
    const collection = db.collection("orders");
    const projection = { _id: 0, orderId: 1, status: 1, createdAt: 1, updatedAt: 1, "customer.name": 1 };

    // Match phone digits even when stored with +91, spaces, hyphens or other separators.
    // This uses MongoDB's regular-expression query support (not newer aggregation operators).
    const phonePattern = phone ? phone.split("").join("\\D*") : "";
    const phoneMatch = phone ? {
      $or: [
        { "customer.phone": { $regex: phonePattern + "$" } },
        { "customer.mobile": { $regex: phonePattern + "$" } },
        { phone: { $regex: phonePattern + "$" } },
      ],
    } : {};

    // An Order ID returns only that exact order. If a phone is also supplied,
    // it must belong to the same order.
    if (hasOrderId) {
      const order = await collection.findOne(
        { $and: [{ orderId }, ...(hasPhone ? [phoneMatch] : [])] },
        { projection },
      );
      if (!order) return NextResponse.json({ error: "या माहितीनुसार ऑर्डर सापडली नाही. तपशील तपासा." }, { status: 404 });
      return NextResponse.json({ ok: true, order });
    }

    // Return every matching ongoing order, excluding delivered orders.
    const orders = await collection.find(
      {
        $and: [
          phoneMatch,
          { status: { $not: /^delivered$/i } },
        ],
      },
      { projection },
    ).sort({ createdAt: -1 }).toArray();

    if (!orders.length) {
      return NextResponse.json({ error: "या मोबाईल नंबरवर कोणतीही सुरू असलेली ऑर्डर सापडली नाही." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, orders, count: orders.length });
  } catch (error) {
    console.error("Order tracking lookup failed", error);
    return NextResponse.json({ error: "Tracking माहिती मिळवता आली नाही." }, { status: 503 });
  }
}
