import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import {
  createAdminSessionToken,
  hashPasswordScrypt,
  SESSION_COOKIE_NAME,
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

    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email aur password required hain." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password kam az kam 8 characters ka hona chahiye." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingCount = await AdminUser.countDocuments({});
    const allowOpenSignup = process.env.ALLOW_ADMIN_SIGNUP === "true";
    if (existingCount > 0 && !allowOpenSignup) {
      return NextResponse.json(
        { error: "Signup disabled. Admin already exists." },
        { status: 409 }
      );
    }

    const already = await AdminUser.findOne({ email }).lean();
    if (already) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const passwordHash = hashPasswordScrypt(password);
    await AdminUser.create({ email, passwordHash });

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
