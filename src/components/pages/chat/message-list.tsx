"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import type { ChatMessage, ProductAnalysis } from "@/types";

interface MessageListProps {
  messages: ChatMessage[];
  analysis?: ProductAnalysis | null;
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    <div
      className="scrollbar-thin max-h-full flex-1 space-y-4 overflow-y-auto p-4"
      ref={containerRef}
      style={{ scrollBehavior: "smooth" }}
    >
      {messages.length === 0 ? (
        <div className="mt-8 text-center text-gray-500">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <p className="font-medium text-lg">
            Welcome to Base Batches Marketplace
          </p>
          <p className="text-sm">
            Upload an image of a product to get started with AI-powered analysis
            and price comparison
          </p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              key={message.id}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.imageUrl && (
                  <div className="mb-2">
                    <Image
                      alt="Uploaded"
                      className="h-auto max-h-48 max-w-full rounded object-cover"
                      height={192}
                      src={message.imageUrl}
                      width={192}
                    />
                  </div>
                )}
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    message.role === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-gray-100 px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-gray-600 border-b-2" />
                  <span className="text-gray-600">Analyzing...</span>
                </div>
              </div>
            </div>
          )}

          {/* Invisible div to scroll to */}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
