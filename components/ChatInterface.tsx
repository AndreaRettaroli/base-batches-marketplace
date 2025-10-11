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
  const [showListingButton, setShowListingButton] = useState(false);
  const [sellerId] = useState('user123'); // TODO: Get from auth
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
        
        // Fetch the complete updated session
        const sessionResponse = await fetch(`/api/chat?sessionId=${session.id}`);
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          onSessionUpdate(sessionData.session);
        } else {
          // Fallback: manually update session
          const updatedSession: ChatSession = {
            ...session,
            messages: [...session.messages, data.chatResponse],
            updatedAt: new Date(),
            state: 'gathering_details' as const
          };
          onSessionUpdate(updatedSession);
        }

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
        
        // Fetch the complete updated session instead of manually managing messages
        const sessionResponse = await fetch(`/api/chat?sessionId=${session.id}`);
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          onSessionUpdate(sessionData.session);
        } else {
          // Fallback: just add the AI response if session fetch fails
          const updatedSession = {
            ...session,
            messages: [...session.messages, data.message],
            updatedAt: new Date(),
          };
          onSessionUpdate(updatedSession);
        }

        // Check if ready to show listing button
        if (data.message.content.includes('ready to list') || data.message.content.includes('create the listing')) {
          setShowListingButton(true);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // You could add a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateListing = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          sellerId: sellerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create listing');
      }

      const data = await response.json();
      
      // Add success message to chat
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🎉 **Listing Created Successfully!** 🎉

Your item has been listed in the marketplace!

**Product ID:** ${data.product.id}
**Title:** ${data.product.title}
**Price:** $${data.product.price}
**Status:** ${data.product.status}

Your listing is now live and potential buyers can find it. Would you like to list another item? Just upload another image to get started! 📸`,
        timestamp: new Date(),
      };
      
      const updatedSession = {
        ...session,
        messages: [...session.messages, successMessage],
        updatedAt: new Date(),
        state: 'listed' as const
      };
      onSessionUpdate(updatedSession);
      setShowListingButton(false);
      
    } catch (error) {
      console.error('Error creating listing:', error);
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Sorry, there was an error creating your listing. Please try again.',
        timestamp: new Date(),
      };
      
      const updatedSession = {
        ...session,
        messages: [...session.messages, errorMessage],
        updatedAt: new Date(),
      };
      onSessionUpdate(updatedSession);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <MessageList 
          messages={session.messages} 
          analysis={analysis}
          isLoading={isLoading}
        />
      </div>

      {/* Analysis Results */}
      {/* {analysis && (
        <div className="border-t bg-gray-50 p-4 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Product Analysis</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Product:</strong> {analysis.imageAnalysis.productName}</p>
                <p><strong>Brand:</strong> {analysis.imageAnalysis.brand || 'Not specified'}</p>
                <p><strong>Category:</strong> {analysis.imageAnalysis.category}</p>
                <p><strong>Condition:</strong> {analysis.imageAnalysis.condition || 'Not specified'}</p>
                <p><strong>Suggested Price:</strong> ${analysis.imageAnalysis.suggestedPrice}</p>
                {analysis.imageAnalysis.tags && analysis.imageAnalysis.tags.length > 0 && (
                  <p><strong>Tags:</strong> {analysis.imageAnalysis.tags.join(', ')}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Market Research</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {analysis.priceComparison.slice(0, 4).map((price, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{price.platform}</span>
                    <div className="text-right">
                      <div className="text-green-600 font-semibold">{price.price}</div>
                      <div className="text-xs text-gray-500">{price.availability}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Create Listing Button */}
      {/* {showListingButton && (
        <div className="border-t bg-blue-50 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Ready to create your listing?</h3>
              <p className="text-sm text-blue-700">Your product details look complete!</p>
            </div>
            <button
              onClick={handleCreateListing}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Creating...' : '🚀 Create Listing'}
            </button>
          </div>
        </div>
      )}  */}
      

      {/* Input Area */}
      <div className="border-t p-4 flex-shrink-0">
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