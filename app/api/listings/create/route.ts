import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '@/services/chatService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, sellerId } = body;

    if (!sessionId || !sellerId) {
      return NextResponse.json(
        { error: 'Session ID and Seller ID are required' },
        { status: 400 }
      );
    }

    const product = await ChatService.createListing(sessionId, sellerId);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Failed to create listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Listing created successfully!'
    });

  } catch (error) {
    console.error('Create listing API error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}