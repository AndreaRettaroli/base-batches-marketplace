import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ChatMessage, ChatSession } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  private static model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
  });

  private static sessions: Map<string, ChatSession> = new Map();

  static createSession(): ChatSession {
    const sessionId = uuidv4();
    const session: ChatSession = {
      id: sessionId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  static getSession(sessionId: string): ChatSession | null {
    return this.sessions.get(sessionId) || null;
  }

  static async sendMessage(
    sessionId: string, 
    message: string, 
    imageUrl?: string
  ): Promise<ChatMessage> {
    let session = this.getSession(sessionId);
    if (!session) {
      // Create a new session if it doesn't exist
      console.log(`Session ${sessionId} not found, creating new session`);
      session = this.createSession();
      // Update the session ID to match the requested one
      session.id = sessionId;
      this.sessions.set(sessionId, session);
    }

    // Add user message to session
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      imageUrl,
    };
    
    session.messages.push(userMessage);

    try {
      // Convert session messages to LangChain format
      const langChainMessages = [
        new SystemMessage(`You are a helpful marketplace assistant that helps users identify products from images and find price information. 
        
        When a user uploads an image:
        1. Analyze the product in the image
        2. Identify brand, product name, and key characteristics
        3. Provide helpful information about the product
        4. Suggest where to find pricing information
        
        Be conversational, helpful, and provide actionable insights.`),
        ...session.messages.map(msg => 
          msg.role === 'user' 
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
        )
      ];

      // Get AI response
      const response = await this.model.invoke(langChainMessages);
      
      // Add AI message to session
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.content.toString(),
        timestamp: new Date(),
      };
      
      session.messages.push(aiMessage);
      session.updatedAt = new Date();
      
      return aiMessage;
    } catch (error) {
      console.error('Error in chat service:', error);
      throw new Error('Failed to generate response');
    }
  }

  static async sendMessageWithProductAnalysis(
    sessionId: string,
    message: string,
    productAnalysis?: any
  ): Promise<ChatMessage> {
    let session = this.getSession(sessionId);
    if (!session) {
      // Create a new session if it doesn't exist
      console.log(`Session ${sessionId} not found, creating new session`);
      session = this.createSession();
      // Update the session ID to match the requested one
      session.id = sessionId;
      this.sessions.set(sessionId, session);
    }

    // Add user message to session
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    session.messages.push(userMessage);

    try {
      let enhancedMessage = message;
      
      if (productAnalysis) {
        enhancedMessage += `\n\nProduct Analysis Results:
        Brand: ${productAnalysis.imageAnalysis.brand || 'Unknown'}
        Product: ${productAnalysis.imageAnalysis.productName || 'Unknown'}
        Category: ${productAnalysis.imageAnalysis.category || 'Unknown'}
        Characteristics: ${productAnalysis.imageAnalysis.characteristics.join(', ')}
        
        Price Comparison:
        ${productAnalysis.priceComparison.map((price: any) => 
          `${price.platform}: ${price.price} - ${price.availability}`
        ).join('\n')}`;
      }

      // Convert session messages to LangChain format
      const langChainMessages = [
        new SystemMessage(`You are a helpful marketplace assistant that helps users identify products and find pricing information. 
        
        Use the provided product analysis to give detailed, helpful responses about:
        - Product identification and features
        - Price comparison insights
        - Shopping recommendations
        - Market trends when relevant
        
        Be conversational and provide actionable advice.`),
        ...session.messages.slice(0, -1).map(msg => 
          msg.role === 'user' 
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
        ),
        new HumanMessage(enhancedMessage)
      ];

      // Get AI response
      const response = await this.model.invoke(langChainMessages);
      
      // Add AI message to session
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.content.toString(),
        timestamp: new Date(),
      };
      
      session.messages.push(aiMessage);
      session.updatedAt = new Date();
      
      return aiMessage;
    } catch (error) {
      console.error('Error in chat service:', error);
      throw new Error('Failed to generate response');
    }
  }

  static getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  static deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}