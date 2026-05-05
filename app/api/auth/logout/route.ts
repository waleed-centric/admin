import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const url = new URL("/login", request.url);
  const res = NextResponse.redirect(url);
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return res;
}
