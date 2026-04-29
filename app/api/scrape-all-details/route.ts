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

    await connectToDatabase();
    
    // Fetch all packages from MongoDB
    const packages = await Package.find({}).lean();

    if (!packages || packages.length === 0) {
      return NextResponse.json(
        { error: "No packages found in MongoDB. Please scrape packages first." },
        { status: 404 }
      );
    }

    const baseHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Cookie": cookie.trim(),
    };

    let updatedCount = 0;
    const errors: string[] = [];
    
    // Process packages in chunks to avoid overwhelming the server or getting rate-limited
    // We'll process them sequentially for stability
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      console.log(`Processing package ${pkg.uuid}`);
      
      if (pkg.uuid) {
        try {
          const summaryUrl = `https://hajj.nusuk.sa/sp/package/summary/${pkg.uuid}`;
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
          console.log(`Response status: ${res.status} ${res.statusText}`);
          if (res.ok) {
            const html = await res.text();
            // Check if it redirected to login
            if (html.includes("Login to Your Account") || res.url.includes("/account/authorize")) {
              errors.push(`Package ${pkg.uuid}: Session expired or login required`);
              break; // Stop loop if session is expired
            }
            pkg.detailed_html = html;
            
            // Save detailed_html to MongoDB
            await Package.updateOne({ uuid: pkg.uuid }, { $set: { detailed_html: html } });
            
            updatedCount++;
          } else {
            const errText = await res.text();
            console.log(`Error Response: ${res.status} ${res.statusText}`);
            errors.push(`Package ${pkg.uuid}: Status ${res.status} - ${errText.substring(0, 100)}`);
          }
          
          // Small delay to be polite to the server
          await new Promise(resolve => setTimeout(resolve, 1500)); // increased delay
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          errors.push(`Package ${pkg.uuid}: Fetch Error - ${msg}`);
          console.error(`Failed to fetch details for package ${pkg.uuid}:`, error);
        }
      }
    }

    return NextResponse.json({
      message: "Detailed data fetched and saved to MongoDB successfully.",
      totalPackages: packages.length,
      updatedPackages: updatedCount,
      errors: errors.slice(0, 5) // Return first 5 errors to frontend for debugging
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
