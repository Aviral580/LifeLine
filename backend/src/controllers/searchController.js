import Page from '../models/Page.js';
import { processQuery } from '../utils/queryProcessor.js';
import { calculateBM25 } from '../services/bm25.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import { classifyIntent } from '../services/aiService.js'; 
import ngramService from '../services/ngramService.js'; 
import { liveScrape } from '../services/scraperService.js';

export const getPredictions = async (req, res) => {
  const { q } = req.query;
  const suggestions = await ngramService.predict(q);
  res.json({ suggestions });
};

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

export const executeSearch = async (req, res) => {
  const { q } = req.query;
  try {
    const tokens = processQuery(q);
    if (tokens.length === 0) return res.status(400).json({ message: "No valid tokens found" });

    const aiAnalysis = await classifyIntent(q);
    
    // 1. LOCAL RETRIEVAL
    let candidates = await Page.find({ tokens: { $in: tokens } })
      .select('title content url tokens category createdAt')
      .limit(150)
      .lean();

    let rankedResults = calculateBM25(tokens, candidates);
    let dataSource = "Local Index (AG News)";

    // 2. QUALITY CHECK: Check if the top local result actually covers our tokens
    const topResult = rankedResults[0];
    const matchedTokensCount = topResult 
      ? tokens.filter(t => topResult.tokens.includes(t)).length 
      : 0;

    // COVERAGE RATIO: If we match less than 50% of the user's terms, it's a "bad match"
    const coverageRatio = matchedTokensCount / tokens.length;

    // 3. AGGRESSIVE TRIGGER
    // Trigger scraper if: No results OR Top score < 12 OR matched < 60% of keywords
    const isLowQuality = rankedResults.length > 0 && parseFloat(topResult.relevanceScore) < 12.0;
    const isPoorCoverage = tokens.length > 1 && coverageRatio < 0.6;

    if (rankedResults.length === 0 || isLowQuality || isPoorCoverage) {
      console.log(`⚠️ Local Quality: ${coverageRatio * 100}% coverage. Fetching Live Web...`);
      
      const externalData = await liveScrape(q);
      
      if (externalData.length > 0) {
        dataSource = "Live Web (Fresh)";
        
        const processedExternal = externalData.map(item => ({
          ...item,
          createdAt: new Date(), // Tagging as "NOW" for freshness
          tokens: processQuery(item.title + " " + item.content)
        }));

        rankedResults = calculateBM25(tokens, processedExternal);

        // Background save for future local hits
        Page.insertMany(processedExternal).catch(() => {});
      }
    }

    // 4. FINAL MAPPING & FRESHNESS BOOST
    const finalResults = rankedResults.slice(0, 10).map(r => {
      // Logic for Freshness: Boost score if the document was created in the last 48 hours
      const isFresh = (new Date() - new Date(r.createdAt)) < (48 * 60 * 60 * 1000);
      const finalScore = isFresh ? parseFloat(r.relevanceScore) * 1.5 : parseFloat(r.relevanceScore);

      return {
        title: r.title,
        url: r.url,
        summary: r.content.substring(0, 200) + "...",
        score: finalScore.toFixed(4),
        source: r.category === 'Scraped' ? "Live Web (Fresh)" : dataSource,
        isVerified: aiAnalysis.isEmergency && isFresh
      };
    });

    res.json({
      query: q,
      emergencyMode: aiAnalysis.isEmergency,
      aiTip: aiAnalysis.survivalTip,
      results: finalResults,
      meta: {
        tokens: tokens,
        coverage: `${(coverageRatio * 100).toFixed(0)}%`,
        engine: "LifeLine Hybrid v1.2"
      }
    });

  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ message: "Internal Error" });
  }
};