import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const classifyIntent = async (query) => {
  const prompt = `
    Analyze the following user search query for a life-safety search engine.
    Query: "${query}"

    Task:
    1. Determine if this is a real-time civic or environmental emergency (Flood, Earthquake, Fire, etc.).
    2. Ignore personal medical issues, fictional stories, or general research.
    3. Return a JSON object with:
       - isEmergency (boolean)
       - category (string: "natural_disaster", "fire", "public_safety", or "none")
       - survivalTip (string: Max 15 words of critical advice for this specific situation)
       - reason (string: brief explanation of why you classified it this way)

    Return ONLY the raw JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean potential markdown and parse JSON
    return JSON.parse(text.replace(/```json|```/g, ""));
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return { isEmergency: false, category: "none", survivalTip: "" };
  }
};