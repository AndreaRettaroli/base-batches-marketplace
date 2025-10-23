"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import type { ChatSession } from "@/types";
import { BottomNav } from "./bottom-nav";
import { ChatPage } from "./chat";
import { HomePage } from "./home";
import { Navbar } from "./navbar";
import { ProfilePage } from "./profile";

export function AppPage() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState<"home" | "chat" | "profile">(
    "home"
  );
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const createNewSession = useCallback(async () => {
    try {
      if (!user?.id) {
        return;
      }
      const response = await fetch("/api/session", {
        method: "POST",
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await response.json();
      setCurrentSession(data.session);

      // Save session ID to localStorage
      localStorage.setItem("marketplaceSessionId", data.session.id);
      console.log("Created new session:", data.session.id);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }, [user]);

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

  const handleCreateNewChat = () => {
    localStorage.removeItem("marketplaceSessionId");
    createNewSession();
    setActivePage("chat");
  };

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

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Navbar setActivePage={setActivePage} />

      <main className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto px-4 py-4 pb-20 sm:px-6 lg:px-8">
        {activePage === "home" ? (
          <HomePage />
        ) : activePage === "profile" ? (
          <ProfilePage onCreateNewChat={handleCreateNewChat} />
        ) : activePage === "chat" ? (
          <ChatPage
            currentSession={currentSession}
            setCurrentSession={setCurrentSession}
          />
        ) : null}
      </main>

      <BottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}
