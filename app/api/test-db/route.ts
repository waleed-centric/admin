import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Package from "@/models/Package";

export async function GET() {
  try {
    await connectToDatabase();
    
    // Test GET: count documents
    const count = await Package.countDocuments();
    
    // Fetch a sample document
    const sample = await Package.findOne().lean();

    return NextResponse.json({
      success: true,
      message: "MongoDB Connection is working!",
      totalPackagesInDb: count,
      samplePackage: sample || "No packages found",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("GET test error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to connect or fetch from MongoDB: " + msg },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    // Parse test data
    const body = await request.json();
    const uuid = body.uuid || `test-${Date.now()}`;
    
    // Test POST: Create or Update a document
    const result = await Package.findOneAndUpdate(
      { uuid: uuid },
      { $set: { ...body, isTestRecord: true } },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Data successfully written to MongoDB!",
      document: result,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("POST test error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to write to MongoDB: " + msg },
      { status: 500 }
    );
  }
}
