import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "g2g_admin_session";
const SESSION_HOURS = 8;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set to a random value of at least 32 characters.");
  }
  return secret;
}

export function passwordMatches(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not configured.");
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b) && candidate.length === expected.length;
}

function signature(expiresAt: string) {
  return createHmac("sha256", sessionSecret()).update(expiresAt).digest("base64url");
}

export function createAdminSession() {
  const expiresAt = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  return { value: expiresAt + "." + signature(expiresAt), maxAge: SESSION_HOURS * 60 * 60 };
}

export function isValidAdminSession(value?: string) {
  if (!value) return false;
  const [expiresAt, suppliedSignature, extra] = value.split(".");
  if (!expiresAt || !suppliedSignature || extra || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Date.now()) return false;
  try {
    const expected = Buffer.from(signature(expiresAt));
    const supplied = Buffer.from(suppliedSignature);
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
  } catch {
    return false;
  }
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 32);
}
