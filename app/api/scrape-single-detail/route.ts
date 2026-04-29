import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Package from "@/models/Package";

export async function POST(request: Request) {
  try {
    const { cookie, uuid } = await request.json();

    if (!cookie || !uuid) {
      return NextResponse.json(
        { error: "Cookie and uuid are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    const baseHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Cookie": cookie.trim(),
    };

    const summaryUrl = `https://hajj.nusuk.sa/sp/package/summary/${uuid}`;
    const res = await fetch(summaryUrl, {
      method: "GET",
      headers: {
        ...baseHeaders,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
      }
    });

    if (res.ok) {
      const html = await res.text();
      if (html.includes("Login to Your Account") || res.url.includes("/account/authorize")) {
        return NextResponse.json(
          { error: "Session expired or login required" },
          { status: 401 }
        );
      }
      
      // Save detailed_html to MongoDB
      await Package.updateOne({ uuid }, { $set: { detailed_html: html } });
      
      return NextResponse.json({ success: true });
    } else {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Status ${res.status} - ${errText.substring(0, 100)}` },
        { status: res.status }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
