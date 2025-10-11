'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { ChatSession } from '@/types';

export default function Home() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrCreateSession();
  }, []);

  const loadOrCreateSession = async () => {
    try {
      setLoading(true);
      
      // Try to get existing session ID from localStorage
      const savedSessionId = localStorage.getItem('marketplaceSessionId');
      
      if (savedSessionId) {
        // Try to fetch existing session
        const response = await fetch(`/api/chat?sessionId=${savedSessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.session) {
            console.log('Loaded existing session:', data.session.id);
            setCurrentSession(data.session);
            return;
          }
        }
      }
      
      // Create new session if no existing session found
      await createNewSession();
    } catch (error) {
      console.error('Failed to load session:', error);
      await createNewSession();
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
      });
      const data = await response.json();
      setCurrentSession(data.session);
      
      // Save session ID to localStorage
      localStorage.setItem('marketplaceSessionId', data.session.id);
      console.log('Created new session:', data.session.id);
    } catch (error) {
      console.error('Failed to create session:', error);
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
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Base Batches Marketplace
            </h1>
            <button
              onClick={() => {
                localStorage.removeItem('marketplaceSessionId');
                createNewSession();
              }}
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 overflow-hidden">
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