import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "INVALID_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Local Fallback Brain: Used when API fails or for speed
const LOCAL_EMERGENCY_KEYWORDS = [
  "earthquake", "flood", "fire", "tsunami", "cyclone", "storm", 
  "hurricane", "tornado", "gas leak", "explosion", "terrorist", 
  "bomb", "shooting", "evacuation", "shelter", "rescue", "trapped",
  "bleeding", "cardiac", "stroke", "unconscious", "poison", "suicide",
  "help", "emergency", "urgent", "SOS", "casualty", "died", "death"
];

export const classifyIntent = async (query) => {
  const cleanQuery = query.toLowerCase();

  // 1. Try Google Gemini AI First
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
    // Clean up markdown code blocks if Gemini sends them
    text = text.replace(/```json|```/g, "").trim();
    
    return JSON.parse(text);

  } catch (error) {
    console.warn("⚠️ AI Offline/Error. Using Local Keyword Fallback.");
    
    // 2. Local Fallback Logic (Regex)
    const isEmergency = LOCAL_EMERGENCY_KEYWORDS.some(word => cleanQuery.includes(word));
    
    let tip = "";
    if (cleanQuery.includes("earthquake")) tip = "Drop, Cover, and Hold On. Stay indoors.";
    else if (cleanQuery.includes("fire")) tip = "Get out, stay out. Call Fire Department.";
    else if (cleanQuery.includes("flood")) tip = "Move to higher ground. Avoid walking in water.";
    else if (cleanQuery.includes("bleeding")) tip = "Apply direct pressure to wound immediately.";
    else if (isEmergency) tip = "Stay calm. Locate nearest safe exit or authority.";

    return {
      isEmergency: isEmergency,
      category: isEmergency ? "general_emergency" : "none",
      survivalTip: tip,
      reason: "Local Keyword Match"
    };
  }
};