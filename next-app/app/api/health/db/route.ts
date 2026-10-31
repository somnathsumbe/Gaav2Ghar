import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { ok: false, databaseConnected: false, error: "MongoDB is not configured." },
      { status: 503 }
    );
  }

  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    const ordersCollectionExists = await db
      .listCollections({ name: "orders" }, { nameOnly: true })
      .hasNext();

    return NextResponse.json({
      ok: true,
      databaseConnected: true,
      ordersCollectionExists,
    });
  } catch (error) {
    console.error("MongoDB health check failed", error);
    return NextResponse.json(
      { ok: false, databaseConnected: false, error: "MongoDB connection check failed." },
      { status: 503 }
    );
  }
}
