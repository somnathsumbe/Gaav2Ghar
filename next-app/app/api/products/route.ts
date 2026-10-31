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
  { id: "onion", name: "कांदा", english: "Onion", varieties: ["गावठी कांदा","लाल कांदा"], pricePerKg: 0, note: "गावाकडचे ताजे कांदे", emoji: "🧅", active: true },
  { id: "wheat", name: "गहू", english: "Wheat", varieties: ["लोकवन गहू","बन्सी गहू","शरबती गहू","GW 496 गहू","श्रीराम-11 गहू"], pricePerKg: 42, note: "दैनंदिन पोळ्यांसाठी", emoji: "🌾", active: true },
  { id: "jowar", name: "ज्वारी", english: "Jowar", varieties: ["मालदांडी ज्वारी"], pricePerKg: 48, note: "पारंपरिक आणि पौष्टिक", emoji: "🌱", active: true },
  { id: "bajri", name: "बाजरी", english: "Bajra", varieties: ["पायनियर बाजरी*","68 बाजरी*","मोहदया बाजरी*"], pricePerKg: 0, note: "पारंपरिक बाजरी", emoji: "🌾", active: true },
  { id: "moong", name: "मूग", english: "Moong", varieties: ["हिरवा अख्खा मूग"], pricePerKg: 0, note: "निवडक मूग", emoji: "🫘", active: true },
  { id: "tur", name: "तूर", english: "Tur", varieties: ["पांढरी तूर"], pricePerKg: 0, note: "निवडक तूर", emoji: "🫘", active: true },
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
    // Keep only the products currently offered in the storefront. Mark legacy records inactive so they disappear from customer and admin product lists without deleting order history.
    await collection.updateMany({ id: { $in: ["rice"] } }, { $set: { active: false, updatedAt: new Date() } });
    await collection.bulkWrite(seedProducts.map((product) => ({
      updateOne: { filter: { id: product.id }, update: { $set: { name: product.name, english: product.english, varieties: product.varieties, note: product.note, emoji: product.emoji, active: true, updatedAt: new Date() }, $setOnInsert: { ...product, createdAt: new Date() } }, upsert: true },
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
