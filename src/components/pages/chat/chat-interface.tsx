"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import type { ChatMessage, ChatSession, ProductAnalysis } from "@/types";
import ImageUpload from "./image-upload";
import MessageInput from "./message-input";
import MessageList from "./message-list";

type ChatInterfaceProps = {
  session: ChatSession;
  onSessionUpdate: (session: ChatSession) => void;
};

export default function ChatInterface({
  session,
  onSessionUpdate,
}: ChatInterfaceProps) {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);

  const handleSendMessage = async (message: string, image?: File) => {
    if (!(message.trim() || image)) {
      return;
    }

    try {
      setIsLoading(true);

      // Create user message immediately for display
      let imageUrl: string | undefined;
      if (image) {
        // Convert image to base64 for immediate display
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = () => {
            imageUrl = reader.result as string;
            resolve();
          };
          reader.readAsDataURL(image);
        });
      }

      // Add user message to session immediately
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content:
          message || "Please analyze this image and find pricing information.",
        timestamp: new Date(),
        imageUrl,
      };

      // Update session with user message immediately
      const sessionWithUserMessage: ChatSession = {
        ...session,
        messages: [...session.messages, userMessage],
        updatedAt: new Date(),
      };
      onSessionUpdate(sessionWithUserMessage);

      if (image) {
        // Handle image analysis
        const formData = new FormData();
        formData.append("image", image);
        formData.append("userId", user?.id || "");
        formData.append("sessionId", session.id);
        formData.append(
          "message",
          message || "Please analyze this image and find pricing information."
        );

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to analyze image");
        }

        const data = await response.json();
        setAnalysis(data.analysis);

        // Don't fetch session again, just add the AI response to current session
        const updatedSession: ChatSession = {
          ...sessionWithUserMessage,
          messages: [...sessionWithUserMessage.messages, data.chatResponse],
          updatedAt: new Date(),
          flowStep: { step: "gather_details" as const },
        };
        onSessionUpdate(updatedSession);
      } else {
        // Handle text-only message
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: session.id,
            userId: user?.id,
            message,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data = await response.json();

        // Don't fetch session again, just add the AI response to current session
        const updatedSession = {
          ...sessionWithUserMessage,
          messages: [...sessionWithUserMessage.messages, data.message],
          updatedAt: new Date(),
        };
        onSessionUpdate(updatedSession);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // You could add a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex size-full flex-col rounded-lg border bg-white shadow-sm">
      {/* Messages Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <MessageList
          analysis={analysis}
          isLoading={isLoading}
          messages={session.messages}
        />
      </div>
      {/* Analysis Results */}
      {/* {analysis && (
        <div className="flex-shrink-0 border-t bg-gray-50">
          <div className="flex items-center justify-between p-4">
            <h3 className="font-medium text-gray-900">Analysis Results</h3>
            <Button
              aria-controls="analysis-content"
              aria-expanded={isAnalysisOpen}
              onClick={() => setIsAnalysisOpen((open) => !open)}
              size="sm"
              variant="ghost"
            >
              {isAnalysisOpen ? "− Minimize" : "+ Expand"}
            </Button>
          </div>
          {isAnalysisOpen && (
            <div className="p-4 pt-0" id="analysis-content">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-medium text-gray-900">
                    Product Analysis
                  </h3>
                  <div className="space-y-1 text-gray-600 text-sm">
                    <p>
                      <strong>Product:</strong>{" "}
                      {analysis.imageAnalysis.productName}
                    </p>
                    <p>
                      <strong>Brand:</strong>{" "}
                      {analysis.imageAnalysis.brand || "Not specified"}
                    </p>
                    <p>
                      <strong>Category:</strong>{" "}
                      {analysis.imageAnalysis.category}
                    </p>
                    <p>
                      <strong>Condition:</strong>{" "}
                      {analysis.imageAnalysis.condition || "Not specified"}
                    </p>
                    <p>
                      <strong>Suggested Price:</strong> $
                      {analysis.imageAnalysis.suggestedPrice}
                    </p>
                    {analysis.imageAnalysis.tags &&
                      analysis.imageAnalysis.tags.length > 0 && (
                        <p>
                          <strong>Tags:</strong>{" "}
                          {analysis.imageAnalysis.tags.join(", ")}
                        </p>
                      )}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 font-medium text-gray-900">
                    Market Research
                  </h3>
                  <div className="max-h-32 space-y-2 overflow-y-auto">
                    {analysis.priceComparison
                      .slice(0, 4)
                      .map((price, index) => (
                        <div
                          className="flex items-center justify-between text-sm"
                          key={`price-comparison-${price.price.toLowerCase()}-${index}`}
                        >
                          <span className="font-medium">{price.platform}</span>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {price.price}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {price.availability}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}{" "} */}
      {/* Input Area */}
      <div className="shrink-0 border-t p-4">
        <div className="flex space-x-2 align-center">
          <ImageUpload onImageSelect={(file) => handleSendMessage("", file)} />
          <MessageInput
            disabled={isLoading}
            onSendMessage={(message) => handleSendMessage(message)}
          />
        </div>
      </div>
    </div>
  );
}
