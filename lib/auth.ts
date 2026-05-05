import crypto from "crypto";

export const SESSION_COOKIE_NAME = "admin_session";

type AdminSessionPayload = {
  sub: "admin";
  iat: number;
  exp: number;
};

function base64UrlEncode(input: Buffer | string) {
  const buffer = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecodeToBuffer(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64");
}

function timingSafeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function hmacSha256(data: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

export function createAdminSessionToken(params: {
  secret: string;
  ttlSeconds: number;
  now?: number;
}) {
  const now = params.now ?? Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload: AdminSessionPayload = {
    sub: "admin",
    iat: now,
    exp: now + params.ttlSeconds,
  };

  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const signaturePart = base64UrlEncode(hmacSha256(signingInput, params.secret));

  return `${signingInput}.${signaturePart}`;
}

export function verifyAdminSessionToken(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;
  const expectedSignature = hmacSha256(signingInput, secret);
  const providedSignature = base64UrlDecodeToBuffer(signaturePart);

  if (!timingSafeEqual(expectedSignature, providedSignature)) return null;

  try {
    const payloadJson = base64UrlDecodeToBuffer(payloadPart).toString("utf8");
    const payload = JSON.parse(payloadJson) as AdminSessionPayload;
    if (payload?.sub !== "admin") return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPasswordScrypt(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export function verifyPasswordScrypt(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  const [, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const derived = crypto.scryptSync(password, salt, expected.length);
  return timingSafeEqual(derived, expected);
}

export function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedEmail) return false;
  if (email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) return false;

  if (expectedPasswordHash?.startsWith("scrypt$")) {
    return verifyPasswordScrypt(password, expectedPasswordHash);
  }

  if (typeof expectedPassword === "string") {
    return password === expectedPassword;
  }

  return false;
}
