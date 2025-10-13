"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/user-button";
import type { ChatSession } from "@/types";
import ChatInterface from "./chat-interface";

export function HomePage() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const createNewSession = useCallback(async () => {
    try {
      const response = await fetch("/api/session", {
        method: "POST",
      });
      const data = await response.json();
      setCurrentSession(data.session);

      // Save session ID to localStorage
      localStorage.setItem("marketplaceSessionId", data.session.id);
      console.log("Created new session:", data.session.id);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }, []);

  const loadOrCreateSession = useCallback(async () => {
    try {
      setLoading(true);

      // Try to get existing session ID from localStorage
      const savedSessionId = localStorage.getItem("marketplaceSessionId");

      if (savedSessionId) {
        // Try to fetch existing session
        const response = await fetch(`/api/chat?sessionId=${savedSessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.session) {
            console.log("Loaded existing session:", data.session.id);
            setCurrentSession(data.session);
            return;
          }
        }
      }

      // Create new session if no existing session found
      await createNewSession();
    } catch (error) {
      console.error("Failed to load session:", error);
      await createNewSession();
    } finally {
      setLoading(false);
    }
  }, [createNewSession]);

  useEffect(() => {
    loadOrCreateSession();
  }, [loadOrCreateSession]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleCreateNewChat = () => {
    localStorage.removeItem("marketplaceSessionId");
    createNewSession();
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex-shrink-0 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Image
                alt="Farcaster Marketplace"
                className="rounded-xl"
                height={32}
                src="/images/icon.png"
                width={32}
              />
              <h1 className="font-bold text-gray-900 text-xl">
                Fc Marketplace
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <Button
                className="rounded-lg bg-blue-600 px-2 py-1 font-medium text-white transition-colors hover:bg-blue-700"
                onClick={handleCreateNewChat}
                type="button"
              >
                New Chat
              </Button>
              <UserButton />
            </div>
          </div>
          <p className="mt-1 text-gray-600">
            Upload product images to get AI-powered analysis and price
            comparisons
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        {currentSession && (
          <ChatInterface
            onSessionUpdate={setCurrentSession}
            session={currentSession}
          />
        )}
      </main>
    </div>
  );
}
