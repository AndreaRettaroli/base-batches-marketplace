import { v4 as uuidv4 } from "uuid";

import type { ChatMessage, ChatSession } from "../types";
import { ListingFlowService } from "./listing-flow.service";

// Regex for detecting price modification requests
const PRICE_MODIFICATION_REGEX =
  /(?:list.*for|price.*at|sell.*for|for)\s*\$?(\d+(?:\.\d{2})?)/i;

// biome-ignore lint/complexity/noStaticOnlyClass: Service classes with static methods are a valid pattern for singleton services
export class ChatService {
  private static sessions: Map<string, ChatSession> = new Map();

  static createSession(userId: string): ChatSession {
    const id = uuidv4();
    const session: ChatSession = {
      id,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      flowStep: { step: "analyze" },
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

  static async sendMessage(
    userId: string,
    sessionId: string,
    message: string,
    imageUrl?: string
  ): Promise<ChatMessage> {
    let session = ChatService.getSession(sessionId);
    if (!session) {
      // Don't create a new session, this should not happen in normal flow
      // Log this as it indicates a potential issue
      console.warn(
        `Session ${sessionId} not found for user ${userId}. This may indicate a session management issue.`
      );
      session = ChatService.createSession(userId);
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

    // Initialize flow step if not exists
    if (!session.flowStep) {
      session.flowStep = { step: "analyze" };
    }

    // Initialize conversation history if not exists
    if (!session.conversationHistory) {
      session.conversationHistory = [];
    }

    // Add user message to conversation history
    session.conversationHistory.push({
      role: "user",
      content: userMessage.content,
    });

    try {
      // Check if user wants to modify the price from a previous analysis
      const lowerMessage = message.toLowerCase();
      const priceMatch = message.match(PRICE_MODIFICATION_REGEX);

      if (
        priceMatch &&
        session.productData &&
        (session.flowStep.step === "propose_listing" ||
          session.flowStep.step === "gather_details" ||
          session.flowStep.step === "confirm_listing")
      ) {
        const newPrice = Number.parseFloat(priceMatch[1]);
        session.productData.price = newPrice;
        session.productData.suggestedPrice = newPrice;

        const priceUpdateMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: `Perfect! I've updated the price to $${newPrice} for your ${session.productData.title}.

Updated Listing:
📝 ${session.productData.description}
💰 Price: $${newPrice} (Updated)
📂 Category: ${session.productData.category}
✨ Condition: ${session.productData.condition}
${session.productData.brand ? `🏷️ Brand: ${session.productData.brand}` : ""}

Would you like to proceed with this listing at $${newPrice}, or would you like to add more details?`,
          timestamp: new Date(),
        };

        session.messages.push(priceUpdateMessage);
        session.updatedAt = new Date();

        // Add AI response to conversation history
        session.conversationHistory.push({
          role: "assistant",
          content: priceUpdateMessage.content,
        });

        return priceUpdateMessage;
      }

      // Check if user wants to confirm listing
      if (
        (lowerMessage.includes("confirm") ||
          lowerMessage.includes("yes") ||
          lowerMessage.includes("list it")) &&
        session.flowStep.step === "confirm_listing" &&
        session.productData
      ) {
        // Create the listing through ListingFlowService
        const listingResult = await ListingFlowService.createListing(
          session.userId,
          session.productData
        );

        if (listingResult.success) {
          const confirmationMessage: ChatMessage = {
            id: uuidv4(),
            role: "assistant",
            content: `🎉 Listing Created Successfully!

Your ${session.productData.title} has been listed in the marketplace at $${session.productData.price}!

Your listing is now live and potential buyers can find it. You'll be notified when someone shows interest! 

Want to list another item? Just upload another image to get started! 📸`,
            timestamp: new Date(),
          };

          session.messages.push(confirmationMessage);
          session.updatedAt = new Date();
          session.flowStep = { step: "list_product" };

          return confirmationMessage;
        }

        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: `❌ Sorry, there was an error creating your listing: ${listingResult.error}. Please try again.`,
          timestamp: new Date(),
        };

        session.messages.push(errorMessage);
        return errorMessage;
      }

      // Special handling for confirm_listing step
      if (session.flowStep.step === "confirm_listing" && session.productData) {
        // User is in confirmation step but didn't say confirm
        // Just ask them to confirm again without calling ListingFlowService
        const confirmationPrompt: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: `I'm ready to create your listing! Here are the details:

**${session.productData.title}**
📝 ${session.productData.description}
💰 **Price: $${session.productData.price}**
📂 Category: ${session.productData.category}
✨ Condition: ${session.productData.condition}
${session.productData.brand ? `🏷️ Brand: ${session.productData.brand}` : ""}

Ready to list your product? Reply with "confirm" to publish your listing!`,
          timestamp: new Date(),
        };

        session.messages.push(confirmationPrompt);
        session.updatedAt = new Date();

        // Add to conversation history
        session.conversationHistory.push({
          role: "assistant",
          content: confirmationPrompt.content,
        });

        return confirmationPrompt;
      }

      // Process the message through the listing flow
      const flowResult = await ListingFlowService.processUserMessage(
        message,
        undefined, // No product analysis for text-only messages
        session.flowStep,
        session.conversationHistory
      );

      // Update session flow step
      session.flowStep = flowResult.nextStep;

      // Handle tool calls (mainly for gathering details or finalizing)
      if (flowResult.toolCall) {
        switch (flowResult.toolCall.name) {
          case "ask_for_additional_info":
            // Keep current product data
            break;

          case "finalize_listing":
            // Update with final listing data
            session.productData = {
              ...session.productData,
              ...flowResult.toolCall.data.finalListing,
            };
            break;

          default:
            // No action needed for other tool calls
            break;
        }
      }

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: flowResult.response,
        timestamp: new Date(),
      };

      session.messages.push(aiMessage);
      session.updatedAt = new Date();

      // Add AI response to conversation history
      session.conversationHistory.push({
        role: "assistant",
        content: flowResult.response,
      });

      return aiMessage;
    } catch (error) {
      console.error("Error in sendMessage:", error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content:
          "Sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
      };

      session.messages.push(errorMessage);
      return errorMessage;
    }
  }

  static async sendMessageWithProductAnalysis(
    userId: string,
    sessionId: string,
    message: string,
    // biome-ignore lint/suspicious/noExplicitAny: need here for mongodb
    productAnalysis?: any
  ): Promise<ChatMessage> {
    let session = ChatService.getSession(sessionId);
    if (!session) {
      session = ChatService.createSession(userId);
      session.id = sessionId;
      ChatService.sessions.set(sessionId, session);
    }

    // Add user message to session (with image URL if available)
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: message,
      timestamp: new Date(),
      imageUrl: productAnalysis?.imageUrl,
    };

    session.messages.push(userMessage);

    // Initialize flow step if not exists
    if (!session.flowStep) {
      session.flowStep = { step: "analyze" };
    }

    // Initialize conversation history if not exists
    if (!session.conversationHistory) {
      session.conversationHistory = [];
    }

    // Add user message to conversation history
    session.conversationHistory.push({
      role: "user",
      content: userMessage.content,
    });

    try {
      // Process the message through the listing flow
      const flowResult = await ListingFlowService.processUserMessage(
        message,
        productAnalysis,
        session.flowStep,
        session.conversationHistory
      );

      // Update session flow step
      session.flowStep = flowResult.nextStep;

      // Handle tool calls
      if (flowResult.toolCall) {
        switch (flowResult.toolCall.name) {
          case "propose_listing":
            // Store the proposed listing data
            session.productData = {
              title: flowResult.toolCall.data.title,
              description: flowResult.toolCall.data.description,
              price: flowResult.toolCall.data.estimatedPrice,
              category: flowResult.toolCall.data.category,
              condition: flowResult.toolCall.data.condition,
              brand: flowResult.toolCall.data.brand,
              tags: flowResult.toolCall.data.tags,
              images: productAnalysis?.imageUrl
                ? [productAnalysis.imageUrl]
                : [],
              marketPriceAnalysis: productAnalysis?.priceComparison || [],
              suggestedPrice: flowResult.toolCall.data.estimatedPrice,
            };
            break;

          case "finalize_listing":
            // Update with final listing data
            session.productData = {
              ...session.productData,
              ...flowResult.toolCall.data.finalListing,
            };
            break;

          default:
            // No action needed for other tool calls
            break;
        }
      }

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: flowResult.response,
        timestamp: new Date(),
      };

      session.messages.push(aiMessage);
      session.updatedAt = new Date();

      // Add AI response to conversation history
      session.conversationHistory.push({
        role: "assistant",
        content: flowResult.response,
      });

      return aiMessage;
    } catch (error) {
      console.error("Error in sendMessageWithProductAnalysis:", error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content:
          "Sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
      };

      session.messages.push(errorMessage);
      return errorMessage;
    }
  }

  static getAllSessions(): ChatSession[] {
    return Array.from(ChatService.sessions.values());
  }

  static deleteSession(sessionId: string): boolean {
    return ChatService.sessions.delete(sessionId);
  }
}
