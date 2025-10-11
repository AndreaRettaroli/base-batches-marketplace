export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface ImageAnalysisResult {
  brand?: string;
  productName?: string;
  category?: string;
  characteristics: string[];
  confidence: number;
}

export interface PriceInfo {
  platform: string;
  price: string;
  currency: string;
  url: string;
  availability: string;
}

export interface ProductAnalysis {
  imageAnalysis: ImageAnalysisResult;
  priceComparison: PriceInfo[];
  searchQuery: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}