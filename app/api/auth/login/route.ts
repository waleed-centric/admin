import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import {
  createAdminSessionToken,
  SESSION_COOKIE_NAME,
  verifyAdminCredentials,
  verifyPasswordScrypt,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "AUTH_SECRET missing on server." },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { email?: unknown; password?: unknown }
      | null;

    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email aur password required hain." },
        { status: 400 }
      );
    }

    let ok = false;

    await connectToDatabase();
    const user = await AdminUser.findOne({ email: email.trim() }, { passwordHash: 1 }).lean();
    if (user?.passwordHash?.startsWith("scrypt$")) {
      ok = verifyPasswordScrypt(password, user.passwordHash);
    } else {
      ok = verifyAdminCredentials(email, password);
    }

    if (!ok) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const ttlSeconds = 60 * 60 * 24 * 7;
    const token = createAdminSessionToken({ secret, ttlSeconds });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ttlSeconds,
    });

    return res;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
