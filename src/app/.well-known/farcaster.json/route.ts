import { NextResponse } from "next/server";
import { getFarcasterManifest } from "@/utils/farcaster";

export function GET() {
  try {
    const manifest = getFarcasterManifest();
    return NextResponse.json(manifest);
  } catch (error) {
    console.error("Error generating manifest:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
