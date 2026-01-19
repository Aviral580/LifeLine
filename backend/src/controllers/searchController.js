import axios from 'axios';
import ngramService from '../services/ngramService.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from '../models/QueryCorpus.js';
import { calculateEmergencyScore } from '../utils/ranker.js';

export const getPredictions = async (req, res) => {
  const { q } = req.query;
  const suggestions = await ngramService.predict(q);
  res.json({ suggestions });
};

export const logSearch = async (req, res) => {
  const { query, sessionId, isEmergencyMode } = req.body;

  try {
    const emergencyDocs = await QueryCorpus.find({ category: 'emergency' });
    const emergencyKeywords = emergencyDocs.map(doc => doc.phrase.toLowerCase());
    const lowerQuery = query.toLowerCase();
    
    const isAutoEmergency = emergencyKeywords.some(key => lowerQuery.includes(key));

    await AnalyticsLog.create({ 
        sessionId, 
        actionType: 'search', 
        targetUrl: 'search_query', 
        isEmergencyMode: isEmergencyMode || isAutoEmergency,
        query 
    });

    if(query && query.length > 2) {
        await ngramService.learn(query, (isEmergencyMode || isAutoEmergency) ? 'emergency' : 'general');
    }

    res.json({ 
      success: true, 
      autoTriggerEmergency: isAutoEmergency 
    });

  } catch (error) {
    console.error("LOGGING ERROR:", error);
    res.status(500).json({ success: false });
  }
};

// UPDATED: Now fetches real results from SerpApi
export const executeSearch = async (req, res) => {
  const { q } = req.query;

  try {
    // 1. Determine Mode Automatically
    const emergencyDocs = await QueryCorpus.find({ category: 'emergency' });
    const emergencyKeywords = emergencyDocs.map(doc => doc.phrase.toLowerCase());
    const isEmergency = emergencyKeywords.some(key => q.toLowerCase().includes(key));

    console.log(`📡 Fetching real results for: "${q}" | Emergency: ${isEmergency}`);

    // 2. Fetch Real-time results from SerpApi (Google Engine)
    const response = await axios.get('https://www.searchapi.io/api/v1/search', {
      params: {
        q: q,
        api_key: process.env.SERP_API_KEY,
        engine: 'google',
        num: 10
      }
    });

    const googleResults = response.data.organic_results || [];

    // 3. Process and Rank Results
    const processedResults = googleResults.map((item, index) => {
      const resultObj = {
        title: item.title,
        source: item.source || "Web Result",
        url: item.link,
        summary: item.snippet,
        publishedAt: item.date || new Date().toISOString(),
        // Map relevance based on original Google rank
        relevanceScore: 1 - (index * 0.05), 
        crossSourceAgreement: 0.8, // Simulated for base scoring
        sourceTrustScore: 50 // Base score (ranker.js will adjust this via trustValidator)
      };

      // 4. Apply Aviral's Weighted Ranking Formula (0.4/0.3/0.2/0.1)
      if (isEmergency) {
        resultObj.rankingScore = calculateEmergencyScore(resultObj);
      } else {
        resultObj.rankingScore = null;
      }

      return resultObj;
    });

    // 5. If Emergency, re-sort based on our custom truth-score
    if (isEmergency) {
      processedResults.sort((a, b) => b.rankingScore - a.rankingScore);
    }

    res.json({
      query: q,
      emergencyMode: isEmergency,
      results: processedResults
    });

  } catch (error) {
    console.error("SERP API ERROR:", error.response?.data || error.message);
    res.status(500).json({ message: "Search Engine failed to fetch live results" });
  }
};