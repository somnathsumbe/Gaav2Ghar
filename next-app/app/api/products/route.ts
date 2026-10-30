import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { isAdminConfigured, isValidAdminSession, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductSeed = {
  id: string; name: string; english: string; varieties: string[];
  pricePerKg: number; note: string; emoji: string; active: boolean;
};

const seedProducts: ProductSeed[] = [
  { id: "wheat", name: "गहू", english: "Wheat", varieties: ["लोकवन", "शरबती", "बन्सी"], pricePerKg: 42, note: "दैनंदिन पोळ्यांसाठी", emoji: "🌾", active: true },
  { id: "jowar", name: "ज्वारी", english: "Jowar", varieties: ["पांढरी ज्वारी", "मालदांडी"], pricePerKg: 48, note: "पारंपरिक आणि पौष्टिक", emoji: "🌱", active: true },
  { id: "bajri", name: "बाजरी", english: "Bajri", varieties: ["पांढरी बाजरी", "करडी बाजरी"], pricePerKg: 0, note: "पारंपरिक बाजरी", emoji: "🌾", active: true },
  { id: "onion", name: "कांदे", english: "Onions", varieties: ["लाल कांदे"], pricePerKg: 0, note: "गावाकडचे कांदे", emoji: "🧅", active: true },
  { id: "rice", name: "तांदूळ", english: "Rice", varieties: ["सुरती", "इंद्रायणी"], pricePerKg: 0, note: "घरच्या जेवणाची चव", emoji: "🍚", active: true },
  { id: "toor-dal", name: "तूर डाळ", english: "Toor Dal", varieties: ["पिवळी तूर डाळ"], pricePerKg: 0, note: "दैनंदिन वापरासाठी", emoji: "🫘", active: true },
  { id: "moong", name: "मूग", english: "Moong", varieties: ["हिरवे मूग"], pricePerKg: 0, note: "पौष्टिक कडधान्य", emoji: "🌱", active: true },
];

function authorized(request: Request) {
  if (!isAdminConfigured()) return false;
  const header = request.headers.get("cookie") || "";
  const part = header.split(";").map((value) => value.trim()).find((value) => value.startsWith(ADMIN_COOKIE_NAME + "="));
  return isValidAdminSession(part ? decodeURIComponent(part.slice(ADMIN_COOKIE_NAME.length + 1)) : undefined);
}

async function openDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  return { client, db: client.db(process.env.MONGODB_DB || "gaav2ghar") };
}

export async function GET() {
  let client: MongoClient | undefined;
  try {
    const connection = await openDb();
    client = connection.client;
    const collection = connection.db.collection("products");
    // Restore products that the previous GET handler automatically hid. Do not mutate availability on reads; admins own the active flag.
    await collection.updateMany({ id: { $in: ["rice", "moong", "toor-dal"] }, active: false }, { $set: { active: true, updatedAt: new Date() } });
    await collection.bulkWrite(seedProducts.map((product) => ({
      updateOne: { filter: { id: product.id }, update: { $setOnInsert: { ...product, createdAt: new Date(), updatedAt: new Date() } }, upsert: true },
    })));
    const products = await collection.find({ active: { $ne: false } }, { projection: { _id: 0 } }).sort({ name: 1 }).toArray();
    return NextResponse.json({ ok: true, products });
  } catch (error) {
    console.error("Product list failed", error);
    return NextResponse.json({ error: "उत्पादने लोड करता आली नाहीत." }, { status: 503 });
  } finally {
    await client?.close();
  }
}

export async function PATCH(request: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ error: "Admin login is not configured." }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const english = typeof body.english === "string" ? body.english.trim() : "";
  const varieties = Array.isArray(body.varieties) ? body.varieties.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 30) : [];
  const pricePerKg = Number(body.pricePerKg);
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";
  const emoji = typeof body.emoji === "string" ? body.emoji.trim().slice(0, 12) : "🌾";
  const active = body.active !== false;

  if (!/^[a-z0-9-]{2,40}$/.test(id) || !name || name.length > 80 || !english || english.length > 80 || varieties.length === 0 || varieties.some((item) => item.length > 80) || !Number.isFinite(pricePerKg) || pricePerKg < 0 || pricePerKg > 100000) {
    return NextResponse.json({ error: "कृपया उत्पादनाचे नाव, English नाव, वाण आणि योग्य किंमत तपासा." }, { status: 400 });
  }

  let client: MongoClient | undefined;
  try {
    const connection = await openDb();
    client = connection.client;
    const result = await connection.db.collection("products").updateOne(
      { id },
      { $set: { id, name, english, varieties, pricePerKg, note, emoji, active, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
    return NextResponse.json({ ok: true, id, created: result.upsertedCount === 1 });
  } catch (error) {
    console.error("Product save failed", error);
    return NextResponse.json({ error: "उत्पादन सेव्ह करता आले नाही." }, { status: 503 });
  } finally {
    await client?.close();
  }
}
