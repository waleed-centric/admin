import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Package from "@/models/Package";

export async function POST(request: Request) {
  try {
    const { cookie } = await request.json();

    if (!cookie) {
      return NextResponse.json(
        { error: "Cookie is required." },
        { status: 400 }
      );
    }

    const baseHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Cookie": cookie.trim(),
    };

    // Step 1: Get the page HTML to extract the verification token
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
        { error: "Could not find __RequestVerificationToken in the page HTML. Cookie might be invalid or expired." },
        { status: 401 }
      );
    }
    
    const token = match[1];

    // Step 2: Fetch the actual packages data
    const apiUrl = "https://hajj.nusuk.sa/Packages?handler=FilterPackages";
    const fetchHeaders = {
      ...baseHeaders,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "RequestVerificationToken": token,
      "X-XSRF-TOKEN": token,
    };

    const payload = {
      "__RequestVerificationToken": token,
      "PackageName": "",
      "AvailablePackagesOnly": false,
      "PreferredPackageOnly": false,
      "ApplicantCountryB2BFlightContractOnly": false
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Failed to fetch packages data. Status: ${res.status}. Response: ${errorText.substring(0, 200)}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Save directly to MongoDB
    await connectToDatabase();

    const scrapedUuids = data.map((pkg: Record<string, unknown>) => pkg.uuid);

    // 1. Jo entries abhi scrape nahi hui, unko "sold out" mark kar do (delete nahi karna)
    await Package.updateMany(
      { uuid: { $nin: scrapedUuids } },
      { $set: { isSoldOut: true } }
    );

    // 2. Jo entries already database mein hain unki UUIDs nikaal lo
    const existingPackages = await Package.find({ uuid: { $in: scrapedUuids } }, { uuid: 1 });
    const existingUuids = new Set(existingPackages.map((p) => p.uuid));

    const bulkOps = [];

    for (const pkg of data) {
      if (existingUuids.has(pkg.uuid)) {
        // 3. Agar entry already hai, toh pura data update/override nahi karna (ignore it)
        // Sirf ensure karna hai ke agar wo pehle sold out thi, toh ab available (false) ho jaye
        bulkOps.push({
          updateOne: {
            filter: { uuid: pkg.uuid },
            update: { $set: { isSoldOut: false } },
          },
        });
      } else {
        // 4. Agar entry bilkul nayi hai, toh insert kar do
        pkg.isSoldOut = false;
        bulkOps.push({
          insertOne: {
            document: pkg,
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await Package.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      message: "Data scraped and saved successfully. New packages added, existing ignored, unavailable marked as sold out.",
      scrapedCount: data.length || 0,
      newAdded: data.length - existingUuids.size,
      existingIgnored: existingUuids.size
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
