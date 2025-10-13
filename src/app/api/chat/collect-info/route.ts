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

    await ChatService.collectAdditionalInfo(sessionId, infoType, value);

    const session = ChatService.getSession(sessionId);

    return NextResponse.json({
      success: true,
      sessionState: session?.state,
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
