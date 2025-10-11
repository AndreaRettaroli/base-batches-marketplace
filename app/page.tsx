'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { ChatSession } from '@/types';

export default function Home() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createNewSession();
  }, []);

  const createNewSession = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/session', {
        method: 'POST',
      });
      const data = await response.json();
      setCurrentSession(data.session);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Base Batches Marketplace
            </h1>
            <button
              onClick={createNewSession}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              New Chat
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            Upload product images to get AI-powered analysis and price comparisons
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentSession && (
          <ChatInterface 
            session={currentSession}
            onSessionUpdate={setCurrentSession}
          />
        )}
      </main>
    </div>
  );
}