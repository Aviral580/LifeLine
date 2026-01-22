import Page from '../models/Page.js';
import { processQuery } from '../utils/queryProcessor.js';
import { calculateBM25 } from '../services/bm25.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from '../models/QueryCorpus.js';
import { calculateEmergencyScore } from '../utils/ranker.js';
import { classifyIntent } from '../services/aiService.js'; 
export const predictSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') return res.json({ suggestions: [] });
    const suggestions = await ngramService.predict(q);
    return res.json({ success: true, suggestions: suggestions || [] });
  } catch (error) {
    console.error("Prediction Error:", error);
    return res.status(500).json({ success: false, suggestions: [] });
  }
};
export const performSearch = async (req, res) => {
  try {
    const { q, mode } = req.query; 
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, message: "Query is required" });
    }
    const cleanQuery = q.toLowerCase().trim();
    const learnedPhrase = await QueryCorpus.findOneAndUpdate(
      { phrase: cleanQuery }, 
      { 
        $inc: { frequency: 1 }, 
        $set: { 
          lastSearched: new Date(),
          mode: mode === 'emergency' ? 'emergency' : 'normal' 
        }
      },
      { 
        upsert: true, 
        new: true,    
        setDefaultsOnInsert: true 
      }
    );
    console.log(`🧠 Learned: "${cleanQuery}" (Freq: ${learnedPhrase.frequency})`);
    ngramService.addPhrase(cleanQuery);
    return res.json({ 
      success: true, 
      message: "Search processed and learned",
      data: {
        query: cleanQuery,
        stats: {
            frequency: learnedPhrase.frequency,
            isNew: learnedPhrase.frequency === 1
        }
      }
    });
  } catch (error) {
    console.error("❌ Search Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
const getUserLocation = async (ip) => {
  try {
    // Set IP to empty string if localhost or undefined (API will detect server IP)
    const cleanIp = (ip === '::1' || ip === '127.0.0.1' || !ip) ? '' : ip;

    // Fix: Completed the URL and closed the backticks properly
    // Assuming 'ip-api.com' based on the response fields (city, regionName)
    const res = await axios.get(`http://ip-api.com/json/${cleanIp}`);

    return res.data.status === 'success' 
      ? `${res.data.city}, ${res.data.regionName}` 
      : "India";
      
  } catch (err) {
    console.error("Location fetch failed:", err.message); // Optional: log the error
    return "India";
  }
};
const calculateConsensus = (currentSnippet, allResults) => {
  if (!currentSnippet) return 0.5;
  const words = currentSnippet.toLowerCase().match(/\b(\w{4,})\b/g) || [];
  let matchingSources = 0;
  allResults.forEach(other => {
    if (other.snippet && other.snippet !== currentSnippet) {
      const otherText = other.snippet.toLowerCase();
      const matches = words.filter(word => otherText.includes(word)).length;
      if (matches >= 3) matchingSources++;
    }
  });
  return Math.min(0.5 + (matchingSources * 0.1), 1.0);
};
export const getPredictions = async (req, res) => {
  const { q } = req.query;
  const suggestions = await ngramService.predict(q);
  res.json({ suggestions });
};
export const logSearch = async (req, res) => {
  const { query, sessionId, isEmergencyMode } = req.body;
  try {
    const aiResponse = await classifyIntent(query);
    const isAutoEmergency = aiResponse.isEmergency;
    await AnalyticsLog.create({ 
        sessionId, 
        actionType: 'search', 
        isEmergencyMode: isEmergencyMode,
        query 
    });
    if(query && query.length > 2) {
        await ngramService.learn(query, (isEmergencyMode || isAutoEmergency) ? 'emergency' : 'general');
    }
    res.json({ success: true, autoTriggerEmergency: isAutoEmergency, aiReasoning: aiResponse.reason });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
export const executeSearch = async (req, res) => {
  const { q } = req.query;
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  try {
    const aiAnalysis = await classifyIntent(q);
    const isEmergency = aiAnalysis.isEmergency;
    console.log(`🧠 AI Mode: ${isEmergency ? 'EMERGENCY' : 'NORMAL'} | Tip: ${aiAnalysis.survivalTip}`);
    const location = await getUserLocation(userIp);
    const hasExplicitLocation = q.split(' ').length > 1;
    const searchQuery = (isEmergency && !hasExplicitLocation) 
      ? `${q} in ${location}` 
      : q;
    const response = await axios.get('https://www.searchapi.io/api/v1/search', {
      params: { q: searchQuery, api_key: process.env.SERP_API_KEY, engine: 'google', num: 10 }
    });
    const webResults = response.data.organic_results || [];
    const processedResults = webResults.map((item, index) => {
      const resultObj = {
        title: item.title,
        source: item.source || "Web Result",
        url: item.link,
        summary: item.snippet,
        publishedAt: item.date || new Date().toISOString(),
        relevanceScore: 1 - (index * 0.05),
      };
      if (isEmergency) {
        resultObj.crossSourceAgreement = calculateConsensus(item.snippet, webResults);
        const score = calculateEmergencyScore(resultObj);
        resultObj.rankingScore = score;
        if (score >= 85) {
          resultObj.verificationStatus = "OFFICIAL";
          resultObj.trustLevel = "high";
        } else if (score >= 55) {
          resultObj.verificationStatus = "VERIFIED NEWS";
          resultObj.trustLevel = "medium";
        } else {
          resultObj.verificationStatus = "UNVERIFIED / RUMOR";
          resultObj.trustLevel = "low";
        }
      } else {
        resultObj.rankingScore = null;
        resultObj.verificationStatus = "GENERAL";
        resultObj.trustLevel = "normal";
      }
      return resultObj;
    });
    if (isEmergency) {
      processedResults.sort((a, b) => b.rankingScore - a.rankingScore);
    }
    res.json({
      query: q,
      emergencyMode: isEmergency,
      aiTip: aiAnalysis.survivalTip,
      results: finalResults.slice(0, 10),
      meta: {
        tokens: tokens,
        coverage: `${(coverageRatio * 100).toFixed(0)}%`,
        engine: "LifeLine Hybrid v1.3 (IR Model)"
      }
    });
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ message: "Internal Error" });
  }
};