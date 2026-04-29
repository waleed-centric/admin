import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");
    const uuid = searchParams.get("uuid");
    const cookie = searchParams.get("cookie");

    if (!packageId || !uuid || !cookie) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    const verificationToken = request.headers.get("RequestVerificationToken");

    const targetUrl = `https://hajj.nusuk.sa/sp/package/summary/${packageId}?handler=HotelServices&uuid=${uuid}`;

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Cookie": cookie,
      "Accept": "*/*",
      "Referer": `https://hajj.nusuk.sa/sp/package/summary/${packageId}`
    };

    if (verificationToken) {
      headers["RequestVerificationToken"] = verificationToken;
    }

    const res = await fetch(targetUrl, {
      method: "GET",
      headers
    });

    if (!res.ok) {
      return new NextResponse(`Failed to fetch hotel services. Status: ${res.status}`, { status: res.status });
    }

    let html = await res.text();

    // Fix relative URLs in the HTML so images load correctly
    const baseUrl = "https://hajj.nusuk.sa";
    html = html
      .replace(/href="(\/[^"]+)"/g, `href="${baseUrl}$1"`)
      .replace(/src="(\/[^"]+)"/g, `src="${baseUrl}$1"`)
      .replace(/url\((['"]?)(\/[^'"]+)\1\)/g, `url($1${baseUrl}$2$1)`);

    // The nusuk page returns raw HTML segment to be injected into the modal
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(msg, { status: 500 });
  }
}
