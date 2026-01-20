// backend/src/controllers/searchController.js

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
    res.json({ success: true, autoTriggerEmergency: isAutoEmergency });
  } catch (error) {
    console.error("LOGGING ERROR:", error);
    res.status(500).json({ success: false });
  }
};

export const executeSearch = async (req, res) => {
  const { q } = req.query;

  try {
    // A. Detect Mode
    const emergencyDocs = await QueryCorpus.find({ category: 'emergency' });
    const emergencyKeywords = emergencyDocs.map(doc => doc.phrase.toLowerCase());
    const isEmergency = emergencyKeywords.some(key => q.toLowerCase().includes(key));

    console.log(`📡 Fetching real results for: "${q}" | Emergency: ${isEmergency}`);

    // B. Fetch Real-time results from SearchAPI.io
    const response = await axios.get('https://www.searchapi.io/api/v1/search', {
      params: {
        q: q,
        api_key: process.env.SERP_API_KEY,
        engine: 'google',
        num: 10
      }
    });

    const webResults = response.data.organic_results || [];

    // C. Process, Rank, and LABEL
    const processedResults = webResults.map((item, index) => {
      const resultObj = {
        title: item.title,
        source: item.source || "Web Result",
        url: item.link,
        summary: item.snippet,
        publishedAt: item.date || new Date().toISOString(),
        relevanceScore: 1 - (index * 0.05), 
        crossSourceAgreement: 0.8,
        sourceTrustScore: 50 
      };

      if (isEmergency) {
        const score = calculateEmergencyScore(resultObj);
        resultObj.rankingScore = score;
        
        // --- TRUTH & MISINFORMATION LABELING ---
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

    // D. Re-sort by Truth Score if in Emergency
    if (isEmergency) {
      processedResults.sort((a, b) => b.rankingScore - a.rankingScore);
    }

    res.json({
      query: q,
      emergencyMode: isEmergency,
      results: processedResults
    });

  } catch (error) {
    console.error("SEARCH ERROR:", error.response?.data || error.message);
    res.status(500).json({ message: "Search Engine failed to fetch live results" });
  }
};