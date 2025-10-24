# 🛍️ Marketplace 🛍️

An intelligent marketplace platform that helps users sell their items by automatically analyzing product images, researching market prices, and creating optimized listings.

![marketplace](./media/Screenshot%202025-10-24%20at%2021.34.13.png)
![product details](./media/Screenshot%202025-10-24%20at%2021.34.41.png)
![Sell](./media/Screenshot%202025-10-24%20at%2021.35.20.png)
![analysing](./media/Screenshot%202025-10-24%20at%2021.35.58.png)
![infos](./media/Screenshot%202025-10-24%20at%2022.35.04.png)
![listing](./media/Screenshot%202025-10-24%20at%2022.35.20.png)
![delete product](./media/Screenshot%202025-10-24%20at%2021.35.03.png)

## 🔗 Links 

1. [Presentation Video](https://www.loom.com/share/a15e20d8352746ab91b497560525c94d)
2. [Product buy Video](https://drive.google.com/file/d/13KbnaafBPkS3-Oy4WtA-pbYPoOB-CpCM/view?usp=sharing)
3. [App live on Farcaster](https://farcaster.xyz/miniapps/eSwcG3YVGdlY/marketplace)
4. [on chain transaction](https://basescan.org/tx/0xf42b9136b5a8b4400c97d6f646ab440d88af5fdbf8c6dc692292c95a839ef384)

## 🚀 Features

### Sell

#### Intelligent Product Analysis

- **AI-Powered Image Recognition**: Uses GPT-4o to automatically identify products from images
- **Brand & Category Detection**: Accurately identifies brand, product name, and category
- **Condition Assessment**: Determines product condition (new, used, vintage, etc.)
- **Smart Tagging**: Generates SEO-friendly tags for better discoverability

#### Real-Time Price Research

- **Market Analysis**: Real price research across multiple platforms (Amazon, eBay, etc.)
- **GPT-Enhanced Pricing**: Uses AI to provide realistic price estimates based on market knowledge
- **Competitive Intelligence**: Shows current market prices and availability

#### Smart Marketplace Flow

1. **Welcome & Guidance**: Greets users and asks them to upload product images
2. **Automatic Analysis**: Analyzes the uploaded image and researches prices
3. **Detail Collection**: Asks for category-specific details (size for clothes, model for electronics, etc.)
4. **Listing Creation**: Creates professional marketplace listings with all collected data
5. **Database Storage**: Stores listings in MongoDB for full marketplace functionality

#### Category-Specific Intelligence

- **Clothing**: Asks for size, material, condition details
- **Electronics**: Requests model, accessories, functionality status
- **Books**: Inquires about edition, condition, cover type
- **Vintage Items**: Collects age, provenance, condition information
- **Ecc Ecc**

### Buy
#### Marketplace
- **Marketplace**: Regular marketplace with some filter
- **Crypto payment**: Buy product with an easy crypto payment

### what next?

### AI Buy approach
Integrate an approach to buy driven by AI that can filter and suggest products basing on your needs.

### Bidding
Integrate budding functionality to buy products.

### Shipping 
Integrate real shipping features.

### AD & Fees
Integrate advertisement and small commission fees on sell to monetise.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, LangChain
- **AI/ML**: OpenAI GPT-4o for image analysis and price research
- **Database**: MongoDB with Mongoose ODM

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

