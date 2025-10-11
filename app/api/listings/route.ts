import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const sellerId = searchParams.get('sellerId');

    if (sellerId) {
      // Get products by seller
      const products = await DatabaseService.getProductsBySeller(sellerId);
      return NextResponse.json({ products });
    }

    if (query) {
      // Search products
      const products = await DatabaseService.searchProducts(query, category || undefined);
      return NextResponse.json({ products });
    }

    // Get all active products (limit to recent ones)
    const products = await DatabaseService.searchProducts('', category || undefined);
    return NextResponse.json({ products: products.slice(0, 20) });

  } catch (error) {
    console.error('Listings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, updates } = body;

    if (!productId || !updates) {
      return NextResponse.json(
        { error: 'Product ID and updates are required' },
        { status: 400 }
      );
    }

    const updatedProduct = await DatabaseService.updateProduct(productId, updates);
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update listing API error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const deleted = await DatabaseService.deleteProduct(productId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete listing API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}