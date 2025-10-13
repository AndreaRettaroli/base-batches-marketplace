import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/lib/env";
import type { ChatMessage, ChatSession } from "../types";
import { DatabaseService } from "./database.service";

type ChatState =
  | "initial"
  | "analyzing"
  | "gathering_details"
  | "ready_to_list"
  | "listed";

export class ChatService {
  private static model = new ChatOpenAI({
    apiKey: env.OPENAI_API_KEY,
    temperature: 0.7,
  });

  private static sessions: Map<string, ChatSession> = new Map();

  static createSession(): ChatSession {
    const id = uuidv4();
    const session: ChatSession = {
      id,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      state: "initial",
    };

    ChatService.sessions.set(id, session);

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content:
        "Hello! I'm your marketplace assistant. What would you like to sell today? You can upload an image of your product and I'll help you analyze it, research pricing, and create a listing.",
      timestamp: new Date(),
    };

    session.messages.push(welcomeMessage);

    return session;
  }

  static getSession(sessionId: string): ChatSession | undefined {
    return ChatService.sessions.get(sessionId);
  }

  static collectAdditionalInfo(
    sessionId: string,
    infoType: string,
    value: string
  ): void {
    const session = ChatService.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    session.productData = { ...session.productData, [infoType]: value };
  }

  static createListing(sessionId: string): Promise<boolean> {
    const session = ChatService.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    return ChatService.createListingFromSession(session);
  }

  private static getSystemPrompt(state: ChatState): string {
    switch (state) {
      case "initial":
        return `You are a helpful marketplace assistant. If the user asks to list or sell a product but hasn't uploaded an image yet, politely ask them to upload an image first so you can analyze it and help them create an accurate listing. Be friendly and guide them through the process.`;

      case "analyzing":
        return `You are analyzing a product. Provide detailed insights about the product's features, condition, and market value based on the analysis data provided.`;

      case "gathering_details":
        return "You are helping gather additional product details. Ask clarifying questions about condition, included accessories, purchase date, or any other relevant details that would help with accurate pricing and listing creation.";

      case "ready_to_list":
        return "You have enough information to create a marketplace listing. The product has been analyzed and you have pricing data. If the user mentions wanting to sell, setting a price, or confirms they want to list the product, treat this as confirmation to create the listing. Ask if they want to create a listing at their specified price or the suggested market price.";

      case "listed":
        return "The product has been successfully listed in the marketplace. Provide confirmation and any next steps for the user.";

      default:
        return "You are a helpful marketplace assistant that helps users identify products, find pricing information, and create listings.";
    }
  }

  private static detectSaleConfirmation(message: string): boolean {
    const confirmationKeywords = [
      "yes",
      "sure",
      "ok",
      "okay",
      "go ahead",
      "create listing",
      "list it",
      "sell it",
      "post it",
      "confirm",
      "proceed",
      "create",
      "let's do it",
      "want to sell",
      "sell for",
      "price at",
      "list for",
      "sell this",
    ];

    const lowerMessage = message.toLowerCase();
    return confirmationKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
  }

  private static extractPriceFromMessage(message: string): number | null {
    // Look for patterns like "$20", "20 dollars", "for 20", "price 20"
    const pricePatterns = [
      /\$(\d+(?:\.\d{2})?)/g, // $20 or $20.50
      /(\d+(?:\.\d{2})?)\s*dollars?/gi, // 20 dollars
      /for\s+(\d+(?:\.\d{2})?)/gi, // for 20
      /price\s+(\d+(?:\.\d{2})?)/gi, // price 20
      /sell\s+for\s+(\d+(?:\.\d{2})?)/gi, // sell for 20
    ];

    for (const pattern of pricePatterns) {
      const match = message.match(pattern);
      if (match) {
        const price = Number.parseFloat(match[1]);
        if (!Number.isNaN(price) && price > 0) {
          return price;
        }
      }
    }

    return null;
  }

  private static async createListingFromSession(
    session: ChatSession
  ): Promise<boolean> {
    if (!session.productData) {
      console.error("No product data found in session");
      return false;
    }

    try {
      // Ensure required fields are present
      const productData = {
        sellerId: `user_${session.id}`,
        title: session.productData.title || "Untitled Product",
        description:
          session.productData.description || "No description provided",
        category: session.productData.category || "Other",
        brand: session.productData.brand,
        condition: session.productData.condition || "used",
        price: session.productData.price || 0,
        currency: session.productData.currency || "USD",
        images: session.productData.images || [],
        tags: session.productData.tags || [],
        specifications: session.productData.specifications || {},
        marketPriceAnalysis: session.productData.marketPriceAnalysis || [],
        suggestedPrice: session.productData.suggestedPrice || 0,
        status: "active" as const,
      };

      const createdProduct = await DatabaseService.createProduct(productData);
      console.log("✅ Product created successfully:", createdProduct.id);
      session.state = "listed";
      return true;
    } catch (error) {
      console.error("❌ Error creating listing:", error);
      return false;
    }
  }

  static async sendMessage(
    sessionId: string,
    message: string,
    imageUrl?: string
  ): Promise<ChatMessage> {
    let session = ChatService.getSession(sessionId);
    if (!session) {
      // Create a new session if it doesn't exist
      console.log(`Session ${sessionId} not found, creating new session`);
      session = ChatService.createSession();
      // Update the session ID to match the requested one
      session.id = sessionId;
      ChatService.sessions.set(sessionId, session);
    }

    // Add user message to session
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: message,
      timestamp: new Date(),
      imageUrl,
    };

    session.messages.push(userMessage);

    // Check for sale confirmation and create listing automatically
    if (
      session.state === "ready_to_list" &&
      ChatService.detectSaleConfirmation(message)
    ) {
      // Check if user specified a price and update it
      const userPrice = ChatService.extractPriceFromMessage(message);
      if (userPrice && session.productData) {
        session.productData.price = userPrice;
      }

      const listingCreated =
        await ChatService.createListingFromSession(session);
      if (listingCreated) {
        const priceText = userPrice
          ? `$${userPrice}`
          : `$${session.productData?.price || 0}`;
        const confirmationMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: `🎉 Perfect! I've successfully created your listing for the ${session.productData?.title} at ${priceText}. Your product is now live in the marketplace and potential buyers can find it. You'll be notified when someone shows interest!`,
          timestamp: new Date(),
        };

        session.messages.push(confirmationMessage);
        session.updatedAt = new Date();

        return confirmationMessage;
      }
    }

    try {
      // Convert session messages to LangChain format with state-aware system prompt
      const systemPrompt = ChatService.getSystemPrompt(
        session.state || "initial"
      );
      const langChainMessages = [
        new SystemMessage(systemPrompt),
        ...session.messages.map((msg) =>
          msg.role === "user"
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
        ),
      ];

      // Get AI response
      const response = await ChatService.model.invoke(langChainMessages);

      // Add AI message to session
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: response.content.toString(),
        timestamp: new Date(),
      };

      session.messages.push(aiMessage);
      session.updatedAt = new Date();

      return aiMessage;
    } catch (error) {
      console.error("Error in chat service:", error);
      throw new Error("Failed to generate response");
    }
  }

  static async sendMessageWithProductAnalysis(
    sessionId: string,
    message: string,
    // biome-ignore lint/suspicious/noExplicitAny: need here for mongodb
    productAnalysis?: any
  ): Promise<ChatMessage> {
    let session = ChatService.getSession(sessionId);
    if (!session) {
      // Create a new session if it doesn't exist
      console.log(`Session ${sessionId} not found, creating new session`);
      session = ChatService.createSession();
      // Update the session ID to match the requested one
      session.id = sessionId;
      ChatService.sessions.set(sessionId, session);
    }

    // Add user message to session
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    session.messages.push(userMessage);

    try {
      let enhancedMessage = message;

      if (productAnalysis) {
        enhancedMessage += `\n\nProduct Analysis Results:
        Brand: ${productAnalysis.imageAnalysis.brand || "Unknown"}
        Product: ${productAnalysis.imageAnalysis.productName || "Unknown"}
        Category: ${productAnalysis.imageAnalysis.category || "Unknown"}
        Characteristics: ${productAnalysis.imageAnalysis.characteristics.join(", ")}
        
        Price Comparison:
        ${productAnalysis.priceComparison
          .map(
            // biome-ignore lint/suspicious/noExplicitAny: need here for mongodb
            (price: any) =>
              `${price.platform}: ${price.price} - ${price.availability}`
          )
          .join("\n")}`;

        // Store product data in session
        session.productData = {
          title: productAnalysis.imageAnalysis.productName,
          description: `${productAnalysis.imageAnalysis.category} from ${productAnalysis.imageAnalysis.brand}. ${productAnalysis.imageAnalysis.characteristics.join(", ")}.`,
          category: productAnalysis.imageAnalysis.category,
          brand: productAnalysis.imageAnalysis.brand,
          condition: productAnalysis.imageAnalysis.condition || "used",
          price: productAnalysis.imageAnalysis.suggestedPrice || 0,
          currency: "USD",
          tags: productAnalysis.imageAnalysis.tags || [],
          marketPriceAnalysis: productAnalysis.priceComparison,
          suggestedPrice: productAnalysis.imageAnalysis.suggestedPrice,
        };

        // Update session state
        session.state = "ready_to_list";
      }

      // Convert session messages to LangChain format with state-aware system prompt
      const systemPrompt = ChatService.getSystemPrompt(
        session.state || "analyzing"
      );

      // Add context about being ready to create listing
      const enhancedSystemPrompt =
        session.state === "ready_to_list"
          ? `${systemPrompt} 

Product Analysis Complete: Based on the image analysis, we have identified a ${session.productData?.title} with a suggested price of $${session.productData?.suggestedPrice}. The user has all the information needed. Ask if they want to create a marketplace listing for this product.`
          : systemPrompt;

      const langChainMessages = [
        new SystemMessage(enhancedSystemPrompt),
        ...session.messages
          .slice(0, -1)
          .map((msg) =>
            msg.role === "user"
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          ),
        new HumanMessage(enhancedMessage),
      ];

      // Get AI response
      const response = await ChatService.model.invoke(langChainMessages);

      // Add AI message to session
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: response.content.toString(),
        timestamp: new Date(),
      };

      session.messages.push(aiMessage);
      session.updatedAt = new Date();

      return aiMessage;
    } catch (error) {
      console.error("Error in chat service:", error);
      throw new Error("Failed to generate response");
    }
  }

  static getAllSessions(): ChatSession[] {
    return Array.from(ChatService.sessions.values());
  }

  static deleteSession(sessionId: string): boolean {
    return ChatService.sessions.delete(sessionId);
  }
}
