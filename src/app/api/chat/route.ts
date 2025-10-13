import { type NextRequest, NextResponse } from "next/server";
import { ChatService } from "@/services/chat.service";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, imageUrl } = await request.json();

    if (!(sessionId && message)) {
      return NextResponse.json(
        { error: "Session ID and message are required" },
        { status: 400 }
      );
    }

    const response = await ChatService.sendMessage(
      sessionId,
      message,
      imageUrl
    );

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

export function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const session = ChatService.getSession(sessionId);
      if (!session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ session });
    }

    // Return all sessions
    const sessions = ChatService.getAllSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat data" },
      { status: 500 }
    );
  }
}
