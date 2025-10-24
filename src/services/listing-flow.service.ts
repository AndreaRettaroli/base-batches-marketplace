/** biome-ignore-all lint/complexity/noStaticOnlyClass: need for static methods */
/** biome-ignore-all lint/suspicious/noExplicitAny: need for any */
import OpenAI from "openai";
import { env } from "@/lib/env";
import type { ProductAnalysis } from "@/types";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export type ListingTool = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
};

export interface ListingFlowStep {
  step:
    | "analyze"
    | "propose_listing"
    | "gather_details"
    | "confirm_listing"
    | "list_product";
  data?: any;
  nextStep?: string;
}

export class ListingFlowService {
  private static tools: ListingTool[] = [
    {
      name: "propose_listing",
      description:
        "Propose a listing with estimated price and basic details after analyzing the product image",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Product title" },
          description: { type: "string", description: "Product description" },
          estimatedPrice: {
            type: "number",
            description: "Estimated price in USD",
          },
          category: { type: "string", description: "Product category" },
          condition: {
            type: "string",
            enum: ["new", "used", "refurbished", "vintage"],
          },
          brand: {
            type: "string",
            description: "Product brand if identifiable",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Relevant tags",
          },
          reasoning: {
            type: "string",
            description: "Brief explanation of the price estimation",
          },
        },
        required: [
          "title",
          "description",
          "estimatedPrice",
          "category",
          "condition",
        ],
      },
    },
    {
      name: "ask_for_additional_info",
      description:
        "Ask user for specific additional information to improve the listing",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: { type: "string" },
            description: "Specific questions to ask the user",
          },
          currentListing: {
            type: "object",
            description: "Current listing data",
          },
        },
        required: ["questions"],
      },
    },
    {
      name: "finalize_listing",
      description:
        "Show final listing summary and ask for confirmation to list the product",
      parameters: {
        type: "object",
        properties: {
          finalListing: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              price: { type: "number" },
              category: { type: "string" },
              condition: { type: "string" },
              brand: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              specifications: { type: "object" },
            },
            required: [
              "title",
              "description",
              "price",
              "category",
              "condition",
            ],
          },
          summary: {
            type: "string",
            description: "Human-readable summary of the listing",
          },
        },
        required: ["finalListing", "summary"],
      },
    },
  ];

  static async processUserMessage(
    message: string,
    productAnalysis?: ProductAnalysis,
    currentStep: ListingFlowStep = { step: "analyze" },
    conversationHistory: any[] = []
  ): Promise<{ response: string; toolCall?: any; nextStep: ListingFlowStep }> {
    const systemPrompt = ListingFlowService.getSystemPrompt(currentStep);

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      {
        role: "user",
        content: ListingFlowService.formatUserMessage(message, productAnalysis),
      },
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages as any,
        tools: ListingFlowService.tools.map((tool) => ({
          type: "function" as const,
          function: tool,
        })),
        tool_choice: ListingFlowService.getToolChoice(currentStep),
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantMessage = completion.choices[0].message;
      const toolCall = assistantMessage.tool_calls?.[0];

      if (toolCall && toolCall.type === "function") {
        const toolData = JSON.parse(toolCall.function.arguments);
        const nextStep = ListingFlowService.determineNextStep(
          toolCall.function.name,
          currentStep
        );

        return {
          response:
            assistantMessage.content ||
            ListingFlowService.generateResponseFromTool(
              toolCall.function.name,
              toolData
            ),
          toolCall: { name: toolCall.function.name, data: toolData },
          nextStep,
        };
      }

      return {
        response:
          assistantMessage.content ||
          "I need more information to help you list this product.",
        nextStep: currentStep,
      };
    } catch (error) {
      console.error("ListingFlowService error:", error);
      return {
        response: "Sorry, I encountered an error. Please try again.",
        nextStep: currentStep,
      };
    }
  }

  private static getSystemPrompt(step: ListingFlowStep): string {
    switch (step.step) {
      case "analyze":
        return "You are a helpful marketplace assistant. When a user uploads a product image and description, analyze it and propose a listing with an estimated price. Use the propose_listing tool to create the initial listing proposal. Be accurate with pricing based on the product condition and market value.";

      case "propose_listing":
        return `You have proposed a listing. Now ask the user if they want to proceed with this listing or if they'd like to modify the price or add more details. If they want to add details, use the ask_for_additional_info tool.`;

      case "gather_details":
        return "You are gathering additional information about the product. Ask specific, relevant questions to improve the listing quality. Use the ask_for_additional_info tool if you need more details, or finalize_listing if you have enough information.";

      case "confirm_listing":
        return "Show the final listing summary and ask the user to confirm if they want to list the product. Use the finalize_listing tool to present the complete listing.";

      default:
        return "You are a helpful marketplace assistant that helps users list their products for sale.";
    }
  }

  private static formatUserMessage(
    message: string,
    productAnalysis?: ProductAnalysis
  ): string {
    if (!productAnalysis) {
      return message;
    }

    return `${message}

Product Analysis:
- Product: ${productAnalysis.imageAnalysis.productName || "Unknown"}
- Brand: ${productAnalysis.imageAnalysis.brand || "Unknown"}
- Category: ${productAnalysis.imageAnalysis.category || "Unknown"}
- Condition: ${productAnalysis.imageAnalysis.condition || "Used"}
- Characteristics: ${productAnalysis.imageAnalysis.characteristics?.join(", ") || "None specified"}
- AI Suggested Price: $${productAnalysis.imageAnalysis.suggestedPrice || 0}

Market Research:
${
  productAnalysis.priceComparison
    ?.map(
      (price) => `- ${price.platform}: ${price.price} (${price.availability})`
    )
    .join("\n") || "No market data available"
}`;
  }

  private static getToolChoice(
    step: ListingFlowStep
  ): "auto" | "none" | { type: "function"; function: { name: string } } {
    switch (step.step) {
      case "analyze":
        return { type: "function", function: { name: "propose_listing" } };
      case "gather_details":
        return "auto";
      case "confirm_listing":
        return { type: "function", function: { name: "finalize_listing" } };
      default:
        return "auto";
    }
  }

  private static determineNextStep(
    toolName: string,
    currentStep: ListingFlowStep
  ): ListingFlowStep {
    switch (toolName) {
      case "propose_listing":
        return { step: "propose_listing", data: currentStep.data };
      case "ask_for_additional_info":
        return { step: "gather_details", data: currentStep.data };
      case "finalize_listing":
        return { step: "confirm_listing", data: currentStep.data };
      default:
        return currentStep;
    }
  }

  private static generateResponseFromTool(
    toolName: string,
    toolData: any
  ): string {
    switch (toolName) {
      case "propose_listing":
        return `I've analyzed your product and here's what I found:

${toolData.title}
📝 ${toolData.description}
💰 Estimated Price: $${toolData.estimatedPrice}
📂 Category: ${toolData.category}
✨ Condition: ${toolData.condition}
${toolData.brand ? `🏷️ Brand: ${toolData.brand}` : ""}

Price Reasoning: ${toolData.reasoning}

Would you like to proceed with this listing at $${toolData.estimatedPrice}, or would you like to adjust the price or add more details?`;

      case "ask_for_additional_info":
        return `To create the best possible listing, I'd like to know more about your product:

${toolData.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}

Please provide any additional information, or just say "proceed" if you're ready to list with the current details.`;

      case "finalize_listing":
        return `Here's your final listing summary:

${toolData.summary}

Final Details:
- Title: ${toolData.finalListing.title}
- Price: $${toolData.finalListing.price}
- Category: ${toolData.finalListing.category}
- Condition: ${toolData.finalListing.condition}
${toolData.finalListing.brand ? `- Brand: ${toolData.finalListing.brand}` : ""}

Ready to list your product? Reply with "confirm" to publish your listing!`;

      default:
        return "Let me help you with your product listing.";
    }
  }
}
