import { NextResponse } from "next/server";
import { getPredictions } from "@/lib/predictions";

export const dynamic = "force-dynamic";
// Headroom for the batched Claude call on a cache-miss request.
export const maxDuration = 60;

export async function GET() {
  try {
    const payload = await getPredictions();
    return NextResponse.json(payload, {
      headers: { "cache-control": "public, max-age=0, s-maxage=60" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build predictions" },
      { status: 502 },
    );
  }
}
