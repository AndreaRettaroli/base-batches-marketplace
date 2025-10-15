/** biome-ignore-all lint/suspicious/noExplicitAny: need here */
import type { MiniAppNotificationDetails } from "@farcaster/miniapp-core";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
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
  suggestedPrice?: number;
  condition?: "new" | "used" | "refurbished" | "vintage";
  tags?: string[];
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
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  state?:
    | "initial"
    | "analyzing"
    | "gathering_details"
    | "ready_to_list"
    | "listed";
  productData?: Partial<MarketplaceProduct>;
}

export interface MarketplaceProduct {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  brand?: string;
  condition: "new" | "used" | "refurbished" | "vintage";
  price: number;
  currency: string;
  images: string[];
  tags: string[];
  specifications: Record<string, any>; // For size, color, model, etc.
  marketPriceAnalysis: PriceInfo[];
  suggestedPrice: number;
  status: "draft" | "active" | "sold" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  views: number;
  favorites: number;
}

export interface UserProfile {
  id: string;
  farcasterFid?: number;
  farcasterNotificationDetails?: MiniAppNotificationDetails;
  walletAddress: string;
  email: string;
  name: string;
  avatar?: string;
  location?: string;
  joinedAt: Date;
  rating: number;
  totalSales: number;
  totalPurchases: number;
}
