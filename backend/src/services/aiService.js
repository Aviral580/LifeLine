import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "INVALID_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Local Fallback Brain
const LOCAL_EMERGENCY_KEYWORDS = [
  "earthquake", "flood", "fire", "tsunami", "cyclone", "storm", 
  "hurricane", "tornado", "gas leak", "explosion", "terrorist", 
  "bomb", "shooting", "evacuation", "shelter", "rescue", "trapped",
  "bleeding", "cardiac", "stroke", "unconscious", "poison", "suicide",
  "help", "emergency", "urgent", "SOS", "casualty", "died", "death"
];

export const classifyIntent = async (query) => {
  const cleanQuery = query.toLowerCase();

  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("No API Key");

    const prompt = `
      Analyze this search query: "${query}"
      Return strictly valid JSON:
      {
        "isEmergency": boolean,
        "category": "natural_disaster" | "medical" | "crime" | "none",
        "survivalTip": "max 10 words actionable advice"
      }
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json|```/g, "").trim();
    
    return JSON.parse(text);

  } catch (error) {
    console.warn("⚠️ AI Offline. Using Local Fallback.");
    
    const isEmergency = LOCAL_EMERGENCY_KEYWORDS.some(word => cleanQuery.includes(word));
    let tip = isEmergency ? "Stay calm. Locate nearest safe exit." : "";
    return { isEmergency, category: "general", survivalTip: tip };
  }
};

// --- NEW: VECTOR EMBEDDING GENERATOR ---
export const generateEmbedding = async (text) => {
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values; // Returns array of floats
    } catch (error) {
        console.error("Embedding Error:", error.message);
        return null; // Fail gracefully
    }
};