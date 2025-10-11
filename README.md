# Base Batches Marketplace

A Next.js application with AI-powered product analysis and price comparison features. Upload product images to get intelligent analysis of brands, characteristics, and find price comparisons across multiple platforms.

## Features

- 🤖 **AI-Powered Image Analysis**: Uses OpenAI's GPT-4 Vision to analyze product images
- 💬 **Interactive Chat Interface**: LangChain-powered chat for natural conversations
- 💰 **Price Comparison**: Automated web scraping for price discovery
- 📱 **Responsive Design**: Built with Tailwind CSS for all devices
- ⚡ **Real-time Updates**: Fast and responsive user interface

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **AI/LLM**: OpenAI GPT-4, LangChain
- **Image Processing**: Sharp
- **Web Scraping**: Axios, Cheerio
- **File Upload**: Multer
- **APIs**: Next.js API Routes

## Setup Instructions

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Next.js Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Get OpenAI API Key**
   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Create an account or sign in
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key to your `.env.local` file

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.
