import type { MiniAppNotificationDetails } from "@farcaster/miniapp-core";
import mongoose from "mongoose";
import { env } from "@/lib/env";
import type { MarketplaceProduct, UserProfile } from "../types";

// MongoDB connection
let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = env.MONGODB_URI || "mongodb://localhost:27017/marketplace";
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

// User Schema
const farcasterNotificationDetailsSchema = new mongoose.Schema({
  token: { type: String, required: true },
  url: { type: String, required: true },
});

// User Profile Schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatar: { type: String },
    location: { type: String },
    farcasterFid: { type: Number, required: false, unique: true },
    farcasterNotificationDetails: { type: farcasterNotificationDetailsSchema },
    walletAddress: { type: String, required: true },
    rating: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Product Schema
const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String },
    condition: {
      type: String,
      enum: ["new", "used", "refurbished", "vintage"],
      required: true,
    },
    price: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    images: [{ type: String }],
    tags: [{ type: String }],
    specifications: { type: mongoose.Schema.Types.Mixed, default: {} },
    marketPriceAnalysis: [
      {
        platform: String,
        price: String,
        currency: String,
        url: String,
        availability: String,
      },
    ],
    suggestedPrice: { type: Number },
    status: {
      type: String,
      enum: ["draft", "active", "sold", "inactive"],
      default: "draft",
    },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Models
export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export const User = mongoose.models.User || mongoose.model("User", userSchema);

// Database Service Class
export class DatabaseService {
  static async createProduct(
    productData: Omit<
      MarketplaceProduct,
      "id" | "createdAt" | "updatedAt" | "views" | "favorites"
    >
  ): Promise<MarketplaceProduct> {
    await connectDatabase();

    try {
      const product = new Product(productData);
      const savedProduct = await product.save();

      return {
        id: savedProduct._id.toString(),
        ...savedProduct.toObject(),
        createdAt: savedProduct.createdAt,
        updatedAt: savedProduct.updatedAt,
      };
    } catch (error) {
      console.error("❌ Error creating product:", error);
      throw new Error("Failed to create product");
    }
  }

  static async getProduct(
    productId: string
  ): Promise<MarketplaceProduct | null> {
    await connectDatabase();

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return null;
      }
      const seller = await User.findById(product.sellerId);

      return {
        id: product._id.toString(),
        ...product.toObject(),
        seller,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (error) {
      console.error("❌ Error getting product:", error);
      return null;
    }
  }

  static async getProductsBySeller(
    sellerId: string
  ): Promise<(MarketplaceProduct & { seller: UserProfile })[]> {
    await connectDatabase();

    try {
      const [products, seller] = await Promise.all([
        Product.find({ sellerId }).sort({ createdAt: -1 }),
        User.findById(sellerId),
      ]);

      return products.map((product) => ({
        id: product._id.toString(),
        ...product.toObject(),
        seller,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      console.error("❌ Error getting products by seller:", error);
      return [];
    }
  }

  static async searchProducts(
    query: string,
    category?: string,
    excludeSellerId?: string
  ): Promise<(MarketplaceProduct & { seller: UserProfile })[]> {
    await connectDatabase();

    try {
      // biome-ignore lint/suspicious/noExplicitAny: need here for mongodb
      const searchFilter: any = {
        status: "active",
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
          { brand: { $regex: query, $options: "i" } },
        ],
      };

      if (category) {
        searchFilter.category = category;
      }

      // Add exclusion filter
      if (excludeSellerId) {
        searchFilter.sellerId = { $ne: excludeSellerId };
      }

      const products = await Product.find(searchFilter)
        .sort({ createdAt: -1 })
        .limit(20);

      const productsWithSeller: (MarketplaceProduct & {
        seller: UserProfile;
      })[] = [];
      for (const product of products) {
        const seller = await User.findById(product.sellerId);
        if (seller) {
          productsWithSeller.push({
            id: product._id.toString(),
            ...product.toObject(),
            seller,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          });
        }
      }

      return productsWithSeller;
    } catch (error) {
      console.error("❌ Error searching products:", error);
      return [];
    }
  }

  static async updateProduct(
    productId: string,
    updates: Partial<MarketplaceProduct>
  ): Promise<MarketplaceProduct | null> {
    await connectDatabase();

    try {
      const product = await Product.findByIdAndUpdate(productId, updates, {
        new: true,
        runValidators: true,
      });

      if (!product) {
        return null;
      }

      return {
        id: product._id.toString(),
        ...product.toObject(),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (error) {
      console.error("❌ Error updating product:", error);
      return null;
    }
  }

  static async deleteProduct(productId: string): Promise<boolean> {
    await connectDatabase();

    try {
      const result = await Product.findByIdAndDelete(productId);
      return !!result;
    } catch (error) {
      console.error("❌ Error deleting product:", error);
      return false;
    }
  }

  static async createUser(
    userData: Omit<
      UserProfile,
      "id" | "joinedAt" | "rating" | "totalSales" | "totalPurchases"
    >
  ): Promise<UserProfile> {
    await connectDatabase();

    try {
      const user = new User(userData);
      const savedUser = await user.save();

      return {
        id: savedUser._id.toString(),
        ...savedUser.toObject(),
        joinedAt: savedUser.createdAt,
      };
    } catch (error) {
      console.error("❌ Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  static async getUser(userId: string): Promise<UserProfile | null> {
    await connectDatabase();

    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      return {
        id: user._id.toString(),
        ...user.toObject(),
        joinedAt: user.createdAt,
      };
    } catch (error) {
      console.error("❌ Error getting user:", error);
      return null;
    }
  }

  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    await connectDatabase();

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return null;
      }
      return {
        id: user._id.toString(),
        ...user.toObject(),
        joinedAt: user.createdAt,
      };
    } catch (error) {
      console.error("❌ Error getting user by email:", error);
      return null;
    }
  }

  static async getUserByFarcasterFid(
    farcasterFid: number
  ): Promise<UserProfile | null> {
    await connectDatabase();

    try {
      const user = await User.findOne({ farcasterFid });
      if (!user) {
        return null;
      }

      return {
        id: user._id.toString(),
        ...user.toObject(),
        joinedAt: user.createdAt,
      };
    } catch (error) {
      console.error("❌ Error getting user by farcaster fid:", error);
      return null;
    }
  }

  static async updateUserFarcasterDetails(
    farcasterFid: number,
    farcasterDetails: MiniAppNotificationDetails
  ): Promise<UserProfile | null> {
    await connectDatabase();

    try {
      const user = await User.findOne(
        { farcasterFid },
        { farcasterDetails },
        { new: true }
      );
      if (!user) {
        return null;
      }
      return {
        id: user._id.toString(),
        ...user.toObject(),
        joinedAt: user.createdAt,
      };
    } catch (error) {
      console.error("❌ Error updating user farcaster details:", error);
      return null;
    }
  }

  static async deleteUserFarcasterDetails(
    farcasterFid: number
  ): Promise<UserProfile | null> {
    await connectDatabase();

    const user = await User.findOneAndUpdate(
      { farcasterFid },
      { $unset: { farcasterDetails: 1 } },
      { new: true }
    );
    if (!user) {
      return null;
    }
    return {
      id: user._id.toString(),
      ...user.toObject(),
      joinedAt: user.createdAt,
    };
  }

  static async createFarcasterUser(
    userData: Omit<
      UserProfile,
      "id" | "joinedAt" | "rating" | "totalSales" | "totalPurchases"
    >
  ): Promise<UserProfile | null> {
    await connectDatabase();

    try {
      const user = new User(userData);
      const savedUser = await user.save();
      return {
        id: savedUser._id.toString(),
        ...savedUser.toObject(),
        joinedAt: savedUser.createdAt,
      };
    } catch (error) {
      console.error("❌ Error creating farcaster user:", error);
      throw new Error("Failed to create user");
    }
  }
}
