# Base Batches Marketplace 🛍️

An intelligent marketplace platform that helps users sell their items by automatically analyzing product images, researching market prices, and creating optimized listings.

## 🚀 Features

### Intelligent Product Analysis

- **AI-Powered Image Recognition**: Uses GPT-4o to automatically identify products from images
- **Brand & Category Detection**: Accurately identifies brand, product name, and category
- **Condition Assessment**: Determines product condition (new, used, vintage, etc.)
- **Smart Tagging**: Generates SEO-friendly tags for better discoverability

### Real-Time Price Research

- **Market Analysis**: Real price research across multiple platforms (Amazon, eBay, etc.)
- **GPT-Enhanced Pricing**: Uses AI to provide realistic price estimates based on market knowledge
- **Competitive Intelligence**: Shows current market prices and availability

### Smart Marketplace Flow

1. **Welcome & Guidance**: Greets users and asks them to upload product images
2. **Automatic Analysis**: Analyzes the uploaded image and researches prices
3. **Detail Collection**: Asks for category-specific details (size for clothes, model for electronics, etc.)
4. **Listing Creation**: Creates professional marketplace listings with all collected data
5. **Database Storage**: Stores listings in MongoDB for full marketplace functionality

### Category-Specific Intelligence

- **Clothing**: Asks for size, material, condition details
- **Electronics**: Requests model, accessories, functionality status
- **Books**: Inquires about edition, condition, cover type
- **Vintage Items**: Collects age, provenance, condition information

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, LangChain
- **AI/ML**: OpenAI GPT-4o for image analysis and price research
- **Database**: MongoDB with Mongoose ODM
- **Image Processing**: Sharp for optimization
- **Web Scraping**: Axios + Cheerio for price data

## Setup Instructions

1. **Install dependencies**

   ```bash
   npm install
   ```

2. Add the environment variables:

   ```bash
   cp .env.example .env
   ```

> Note: These variables are validated in `src/lib/env.ts`. Ensure values are present for your deployment target.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Run a local tunneling server, follow the guide from our friends at [Dtech Vision](https://dtech.vision/farcaster/miniapps/theultimatefarcasterminiappdebuggingguide/#warpcast-debugger) to generate a tunnel to expose your localhost using Cloudflare Tunnels (recommended) or ngrok.

5. Generate your Farcaster Manifest variables, follow these [instructions](https://miniapps.farcaster.xyz/docs/guides/publishing)

   - Visit [Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest)
   - Paste your tunnel domain
