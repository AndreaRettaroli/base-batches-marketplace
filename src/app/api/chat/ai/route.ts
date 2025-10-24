import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { ChatService } from "@/services/chat.service";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId, userId } = await request.json();

    if (!(messages && sessionId && userId)) {
      return NextResponse.json(
        { error: "Messages, session ID and user ID are required" },
        { status: 400 }
      );
    }

    // Get or create session
    let session = ChatService.getSession(sessionId);
    if (!session) {
      session = ChatService.createSession(userId);
      session.id = sessionId;
    }

    // Convert messages to the session format and store them
    const lastMessage = messages.at(-1);
    if (lastMessage && lastMessage.role === "user") {
      // Add user message to session
      const userMessage = {
        id: Date.now().toString(),
        role: "user" as const,
        content: lastMessage.content,
        timestamp: new Date(),
        imageUrl: lastMessage.imageUrl,
      };
      session.messages.push(userMessage);
    }

    // Initialize flow step if not exists
    if (!session.flowStep) {
      session.flowStep = { step: "analyze" };
    }

    // System prompt based on flow step
    const getSystemPrompt = (step: string) => {
      switch (step) {
        case "analyze":
          return `You are a helpful marketplace assistant. When a user uploads a product image, analyze it and propose a listing with an estimated price. Be specific about the product details and provide a realistic market price based on the condition and features you can see.

If the user provides product analysis data, use it to create a detailed listing proposal. Always ask the user if they want to proceed with the suggested price or if they'd like to modify anything.

Format your response clearly with:
- Product title
- Estimated price
- Condition assessment
- Brief description
- Ask for confirmation or modifications`;

        case "propose_listing":
          return `You have proposed a listing. The user can now:
1. Confirm they want to proceed with the current price
2. Suggest a different price
3. Provide additional product details
4. Ask for more information

If they want to proceed, ask them for any additional details that would improve the listing quality.`;

        case "gather_details":
          return `You are gathering additional information about the product. Ask specific, relevant questions about:
- Exact condition details
- Included accessories
- Purchase date or age
- Any defects or damage
- Storage or usage information

Keep questions focused and relevant to the product type.`;

        case "confirm_listing":
          return "Present the final listing summary and ask the user to confirm if they want to create the listing. Show all details clearly and ask for final confirmation.";

        default:
          return "You are a helpful marketplace assistant that helps users list their products for sale.";
      }
    };

    const systemPrompt = getSystemPrompt(session.flowStep.step);

    // Convert messages for AI
    const coreMessages = convertToCoreMessages([
      { role: "system", content: systemPrompt },
      ...messages,
    ]);

    // Stream the response
    const result = await streamText({
      model: openai("gpt-4"),
      messages: coreMessages,
      temperature: 0.7,
      onFinish: (completion) => {
        // Add AI response to session
        const aiMessage = {
          id: Date.now().toString(),
          role: "assistant" as const,
          content: completion.text,
          timestamp: new Date(),
        };
        session.messages.push(aiMessage);
        session.updatedAt = new Date();

        // Simple flow progression logic
        const userMessage = lastMessage.content.toLowerCase();

        if (
          session.flowStep?.step === "analyze" &&
          completion.text.includes("$")
        ) {
          session.flowStep = { step: "propose_listing" };
        } else if (
          session.flowStep?.step === "propose_listing" &&
          (userMessage.includes("yes") ||
            userMessage.includes("proceed") ||
            userMessage.includes("good"))
        ) {
          session.flowStep = { step: "gather_details" };
        } else if (
          session.flowStep?.step === "gather_details" &&
          (userMessage.includes("ready") ||
            userMessage.includes("that's all") ||
            userMessage.includes("proceed"))
        ) {
          session.flowStep = { step: "confirm_listing" };
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
