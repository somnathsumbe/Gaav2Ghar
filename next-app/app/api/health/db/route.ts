import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

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

  let client: MongoClient | undefined;
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "gaav2ghar");
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
  } finally {
    await client?.close();
  }
}
