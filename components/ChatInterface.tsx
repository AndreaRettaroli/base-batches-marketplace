'use client';

import { useState, useRef } from 'react';
import { ChatSession, ChatMessage, ProductAnalysis } from '@/types';
import ImageUpload from './ImageUpload';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatInterfaceProps {
  session: ChatSession;
  onSessionUpdate: (session: ChatSession) => void;
}

export default function ChatInterface({ session, onSessionUpdate }: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async (message: string, image?: File) => {
    if (!message.trim() && !image) return;

    try {
      setIsLoading(true);

      if (image) {
        // Handle image analysis
        const formData = new FormData();
        formData.append('image', image);
        formData.append('sessionId', session.id);
        formData.append('message', message || 'Please analyze this image and find pricing information.');

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to analyze image');
        }

        const data = await response.json();
        setAnalysis(data.analysis);
        
        // Update session with the new message
        const updatedSession = {
          ...session,
          messages: [...session.messages, data.chatResponse],
          updatedAt: new Date(),
        };
        onSessionUpdate(updatedSession);
      } else {
        // Handle text-only message
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session.id,
            message,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        
        // Update session with the new messages
        const updatedSession = {
          ...session,
          messages: [...session.messages, data.message],
          updatedAt: new Date(),
        };
        onSessionUpdate(updatedSession);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // You could add a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={session.messages} 
          analysis={analysis}
          isLoading={isLoading}
        />
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="border-t bg-gray-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Product Analysis</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Brand:</strong> {analysis.imageAnalysis.brand || 'Unknown'}</p>
                <p><strong>Product:</strong> {analysis.imageAnalysis.productName}</p>
                <p><strong>Category:</strong> {analysis.imageAnalysis.category}</p>
                <p><strong>Characteristics:</strong> {analysis.imageAnalysis.characteristics.join(', ')}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Price Comparison</h3>
              <div className="space-y-2">
                {analysis.priceComparison.map((price, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{price.platform}</span>
                    <span className="text-green-600">{price.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <ImageUpload onImageSelect={(file) => handleSendMessage('', file)} />
          <MessageInput 
            onSendMessage={(message) => handleSendMessage(message)}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}