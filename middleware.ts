import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "admin_session";

function base64UrlDecodeToBytes(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlDecodeToString(input: string) {
  const bytes = base64UrlDecodeToBytes(input);
  return new TextDecoder().decode(bytes);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifyAdminSessionToken(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput))
  );

  const providedSignature = base64UrlDecodeToBytes(signaturePart);
  if (!timingSafeEqual(signature, providedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecodeToString(payloadPart)) as {
      sub?: unknown;
      exp?: unknown;
    };
    if (payload?.sub !== "admin") return null;
    const exp = typeof payload.exp === "number" ? payload.exp : NaN;
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(exp) || exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth")
  ) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const secret = process.env.AUTH_SECRET;
    if (pathname === "/login" && token && secret) {
      const ok = await verifyAdminSessionToken(token, secret);
      if (!ok) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return redirectToLogin(request);
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return redirectToLogin(request);
  }

  const session = await verifyAdminSessionToken(token, secret);
  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const res = redirectToLogin(request);
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
