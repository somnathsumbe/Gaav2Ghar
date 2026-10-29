import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSession, isAdminConfigured, passwordMatches } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin login is not configured on the server." }, { status: 503 });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password.length > 200 || !passwordMatches(body.password)) {
    return NextResponse.json({ error: "पासवर्ड चुकीचा आहे." }, { status: 401 });
  }

  const session = createAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, session.value, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  return response;
}
