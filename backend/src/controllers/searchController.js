import Page from '../models/Page.js';
import { processQuery } from '../utils/queryProcessor.js';
import { calculateBM25 } from '../services/bm25.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import { classifyIntent } from '../services/aiService.js'; 
import ngramService from '../services/ngramService.js'; // Ensure this exists or mock it

// 1. Missing getPredictions
export const getPredictions = async (req, res) => {
  const { q } = req.query;
  const suggestions = await ngramService.predict(q);
  res.json({ suggestions });
};

// 2. Missing logSearch
export const logSearch = async (req, res) => {
  const { query, sessionId, isEmergencyMode } = req.body;
  try {
    await AnalyticsLog.create({ 
        sessionId, 
        actionType: 'search', 
        isEmergencyMode: isEmergencyMode,
        query 
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// 3. The Main ExecuteSearch
export const executeSearch = async (req, res) => {
  const { q } = req.query;
  try {
    const tokens = processQuery(q);
    if (tokens.length === 0) return res.status(400).json({ message: "No valid tokens found" });

    const aiAnalysis = await classifyIntent(q);
    
    // Find candidates in Local 120k Index
    const candidates = await Page.find({ tokens: { $in: tokens } })
      .select('title content url tokens category')
      .limit(200)
      .lean();

    // Rank using our BM25 math
    const rankedResults = calculateBM25(tokens, candidates);

    res.json({
      query: q,
      processedTokens: tokens,
      emergencyMode: aiAnalysis.isEmergency,
      results: rankedResults.slice(0, 10).map(r => ({
        title: r.title,
        url: r.url,
        summary: r.content.substring(0, 180) + "...",
        score: r.relevanceScore,
        category: r.category
      }))
    });
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ message: "Search failed" });
  }
};