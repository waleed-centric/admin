import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { cookie, id } = await request.json();

    if (!cookie || !id) {
      return NextResponse.json(
        { error: "Cookie and id are required." },
        { status: 400 }
      );
    }

    const baseHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Cookie": cookie.trim(),
    };

    // Step 1: Get token
    const pageRes = await fetch("https://hajj.nusuk.sa/Packages", {
      method: "GET",
      headers: baseHeaders,
    });

    if (!pageRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch main page. Status: ${pageRes.status}` },
        { status: pageRes.status }
      );
    }

    const html = await pageRes.text();
    const match = html.match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/);
    
    if (!match) {
      return NextResponse.json(
        { error: "Could not find token. Cookie might be invalid." },
        { status: 401 }
      );
    }
    // const token = match[1];

    // Step 2: Fetch package details API
    // User requested to try /sp/package/summary
    const summaryUrl = `https://hajj.nusuk.sa/sp/package/summary/${id}`;
    
    const res = await fetch(summaryUrl, {
      method: "GET",
      headers: {
        ...baseHeaders,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      }
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch detail data. Status: ${res.status}` },
        { status: res.status }
      );
    }

    const text = await res.text();

    // Debug code removed to stop generating local files


    // Check if it's a login page
    if (text.includes("Login to Your Account") || res.url.includes("/account/authorize")) {
      return NextResponse.json({ 
        success: false, 
        error: "Session expired or login required to view package details.",
        isHtml: true,
        snippet: text.substring(0, 500)
      });
    }

    // Fix relative URLs in the HTML so CSS, Images and JS load correctly in the iframe
    const baseUrl = "https://hajj.nusuk.sa";
    let fixedHtml = text
      .replace(/href="(\/[^"]+)"/g, `href="${baseUrl}$1"`)
      .replace(/src="(\/[^"]+)"/g, `src="${baseUrl}$1"`)
      .replace(/url\((['"]?)(\/[^'"]+)\1\)/g, `url($1${baseUrl}$2$1)`)
      .replace(/\?handler=HotelServices&uuid=/g, `/api/hotel-services?packageId=${id}&cookie=${encodeURIComponent(cookie)}&uuid=`);

    // Inject CSS to hide header and footer
    const hideHeaderFooterCSS = `
    <style>
      header, footer, nav, 
      .header, .footer, .navbar, .site-header, .site-footer, .main-header, .main-footer,
      [data-testid="header"], [data-testid="footer"],
      #header, #footer { 
        display: none !important; 
        opacity: 0 !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
        position: absolute !important;
        z-index: -9999 !important;
      }
      body { 
        padding-top: 0 !important; 
        margin-top: 0 !important; 
      }
    </style>
    </head>`;
    
    fixedHtml = fixedHtml.replace('</head>', hideHeaderFooterCSS);

    // Try to extract useful data from the HTML if it's the actual summary page
    // Look for __NEXT_DATA__ or any embedded JSON state
    let embeddedData = null;
    const jsonMatch = fixedHtml.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonMatch) {
      try {
        embeddedData = JSON.parse(jsonMatch[1]);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ 
      success: true, 
      source: "html", 
      data: embeddedData || { 
        message: "Successfully fetched summary page",
        htmlLength: fixedHtml.length,
        htmlContent: fixedHtml,
        isHtml: true 
      } 
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
