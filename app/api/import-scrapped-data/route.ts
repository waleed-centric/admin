import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Package from "@/models/Package";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getUuid(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const uuid = value.uuid;
  return typeof uuid === "string" && uuid.trim() ? uuid.trim() : null;
}

export async function POST() {
  try {
    await connectToDatabase();

    const filePath = path.join(process.cwd(), "scrapped_data.json");
    const fileContents = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(fileContents) as unknown;

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { success: false, error: "scrapped_data.json must be an array." },
        { status: 400 }
      );
    }

    const items = parsed.filter(isRecord);
    const packagesWithUuid = items
      .map((pkg) => ({ pkg, uuid: getUuid(pkg) }))
      .filter((x): x is { pkg: Record<string, unknown>; uuid: string } => !!x.uuid);

    if (packagesWithUuid.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid packages with uuid found in scrapped_data.json." },
        { status: 400 }
      );
    }

    const uuids = packagesWithUuid.map((x) => x.uuid);

    const soldOutUpdate = await Package.updateMany(
      { uuid: { $nin: uuids } },
      { $set: { isSoldOut: true } }
    );

    const bulkOps = packagesWithUuid.map(({ pkg, uuid }) => ({
      updateOne: {
        filter: { uuid },
        update: { $set: { ...pkg, isSoldOut: false } },
        upsert: true,
      },
    }));

    const writeResult = await Package.bulkWrite(bulkOps, { ordered: false });

    return NextResponse.json({
      success: true,
      message: "scrapped_data.json import completed.",
      filePath,
      totalInFile: parsed.length,
      validPackages: packagesWithUuid.length,
      soldOutMarked: soldOutUpdate.modifiedCount ?? 0,
      upserted: writeResult.upsertedCount ?? 0,
      modified: writeResult.modifiedCount ?? 0,
      matched: writeResult.matchedCount ?? 0,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
