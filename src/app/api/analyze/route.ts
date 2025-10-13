import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { ChatService } from "@/services/chat.service";
import { ImageAnalysisService } from "@/services/image-analysis.service";
import { PriceScrapingService } from "@/services/price-scraping.service";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const sessionId = formData.get("sessionId") as string;
    const message =
      (formData.get("message") as string) ||
      "Please analyze this image and find pricing information.";

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize image size for API
    const optimizedBuffer = await sharp(buffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Convert to base64
    const base64Image = optimizedBuffer.toString("base64");

    // Analyze image with OpenAI
    console.log("Analyzing image...");
    const imageAnalysis = await ImageAnalysisService.analyzeImage(base64Image);

    // Generate search query
    const searchQuery = ImageAnalysisService.generateSearchQuery(imageAnalysis);
    console.log("Search query:", searchQuery);

    // Search for prices
    console.log("Searching for prices...");
    const priceComparison =
      await PriceScrapingService.searchPrices(searchQuery);

    const productAnalysis = {
      imageAnalysis,
      priceComparison,
      searchQuery,
    };

    // Send message to chat with analysis results
    const chatResponse = await ChatService.sendMessageWithProductAnalysis(
      sessionId,
      message,
      productAnalysis
    );

    return NextResponse.json({
      analysis: productAnalysis,
      chatResponse,
    });
  } catch (error) {
    console.error("Image analysis API error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper endpoint to just get price information without image
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const priceComparison = await PriceScrapingService.searchPrices(query);

    return NextResponse.json({
      query,
      priceComparison,
    });
  } catch (error) {
    console.error("Price search API error:", error);
    return NextResponse.json(
      { error: "Failed to search prices" },
      { status: 500 }
    );
  }
}
