import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    message: "Base Batches Marketplace API is working!",
    timestamp: new Date().toISOString(),
  });
}
