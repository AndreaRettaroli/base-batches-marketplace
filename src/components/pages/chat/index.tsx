"use client";

import type { Dispatch, SetStateAction } from "react";
import type { ChatSession } from "@/types";
import ChatInterface from "./chat-interface";

export function ChatPage({
  currentSession,
  setCurrentSession,
}: {
  currentSession: ChatSession | null;
  setCurrentSession: Dispatch<SetStateAction<ChatSession | null>>;
}) {
  return (
    <div className="flex size-full flex-col bg-gray-50">
      <main className="mx-auto w-full max-w-7xl flex-1 overflow-hidden px-1 py-1 sm:px-4 lg:px-6">
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
