import { type NextRequest, NextResponse } from "next/server";
import { ChatService } from "@/services/chat.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, infoType, value } = body;

    if (!(sessionId && infoType && value)) {
      return NextResponse.json(
        { error: "Session ID, info type, and value are required" },
        { status: 400 }
      );
    }

    // Update product data for the session
    const session = ChatService.getSession(sessionId);
    if (session && session.productData) {
      session.productData = { ...session.productData, [infoType]: value };
    }

    return NextResponse.json({
      success: true,
      flowStep: session?.flowStep,
      productData: session?.productData,
    });
  } catch (error) {
    console.error("Collect info API error:", error);
    return NextResponse.json(
      { error: "Failed to collect information" },
      { status: 500 }
    );
  }
}
