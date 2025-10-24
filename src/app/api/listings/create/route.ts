import { type NextRequest, NextResponse } from "next/server";
import { ChatService } from "@/services/chat.service";
import { ListingFlowService } from "@/services/listing-flow.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, sellerId } = body;

    if (!(sessionId && sellerId)) {
      return NextResponse.json(
        { error: "Session ID and Seller ID are required" },
        { status: 400 }
      );
    }

    // Get session and product data
    const session = ChatService.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.productData) {
      return NextResponse.json(
        { error: "No product data available in session" },
        { status: 400 }
      );
    }

    // Create listing through ListingFlowService
    const result = await ListingFlowService.createListing(
      sellerId,
      session.productData
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to create listing", details: result.error },
        { status: 500 }
      );
    }

    // Return the product data that the frontend expects
    return NextResponse.json({
      success: true,
      product: {
        id: result.productId,
        title: session.productData.title,
        price: session.productData.price,
        status: "active",
      },
      message: "Listing created successfully!",
    });
  } catch (error) {
    console.error("Create listing API error:", error);
    return NextResponse.json(
      {
        error: "Failed to create listing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
