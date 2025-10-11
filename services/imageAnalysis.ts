import OpenAI from 'openai';
import { ImageAnalysisResult } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export class ImageAnalysisService {
  static async analyzeImage(imageBase64: string): Promise<ImageAnalysisResult> {

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and identify the product. You must respond with ONLY valid JSON in this exact format:

{
  "brand": "brand name or null if not visible",
  "productName": "specific product name or description",
  "category": "product category (electronics, clothing, accessories, home, sports, etc.)",
  "characteristics": ["color", "size", "material", "style", "other features"],
  "confidence": 0.85
}

Do not include any text before or after the JSON. Analyze the image carefully and provide accurate details.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });
      console.log("🚀 ~ ImageAnalysisService ~ analyzeImage ~ response:", response);
      console.log("🚀 ~ Raw content:", response.choices[0]?.message?.content);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        // Try to extract JSON from the response (in case there's extra text)
        let jsonString = content.trim();

        // Look for JSON object in the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }

        console.log("🚀 ~ Attempting to parse JSON:", jsonString);
        const result = JSON.parse(jsonString) as ImageAnalysisResult;

        // Validate the result has required fields
        if (!result.productName || !result.category) {
          throw new Error('Invalid result structure');
        }

        return result;
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.log('Original content:', content);

        // Fallback: try to extract information manually
        const fallbackResult: ImageAnalysisResult = {
          productName: content.substring(0, 100).replace(/[{}"]/g, '').trim(),
          category: 'unknown',
          characteristics: ['Unable to parse detailed characteristics'],
          confidence: 0.3
        };

        // Try to extract brand if mentioned
        const brandMatch = content.match(/(?:brand|Brand)[":]\s*["']?([^"',\n}]+)["']?/i);
        if (brandMatch) {
          fallbackResult.brand = brandMatch[1].trim();
        }

        return fallbackResult;
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image');
    }
  }

  static generateSearchQuery(analysis: ImageAnalysisResult): string {
    const parts = [];

    if (analysis.brand) {
      parts.push(analysis.brand);
    }

    if (analysis.productName) {
      parts.push(analysis.productName);
    }

    // Add key characteristics
    if (analysis.characteristics && analysis.characteristics.length > 0) {
      parts.push(...analysis.characteristics.slice(0, 3)); // Limit to top 3 characteristics
    }

    return parts.join(' ').trim();
  }
}