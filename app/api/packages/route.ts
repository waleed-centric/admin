import { NextResponse } from "next/server";
import { fetchUsenusukPackages } from "../../../services/nusukPackages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { source, lastUpdated, packages } = await fetchUsenusukPackages();

  return NextResponse.json(
    { source, lastUpdated, count: packages.length, packages },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

