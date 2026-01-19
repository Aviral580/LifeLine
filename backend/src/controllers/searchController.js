import ngramService from '../services/ngramService.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from '../models/QueryCorpus.js';
import { calculateEmergencyScore } from '../utils/ranker.js';

// Simulated Data to test Aviral's Ranking Formula (0.4/0.3/0.2/0.1)
const MOCK_DATA = [
  {
    title: "Official NDMA Earthquake Safety Protocols",
    source: "NDMA India",
    sourceTrustScore: 98,
    publishedAt: new Date().toISOString(), // 0 hours ago
    crossSourceAgreement: 0.95,
    relevanceScore: 0.9,
    url: "https://ndma.gov.in/earthquake-safety"
  },
  {
    title: "UNVERIFIED: Massive building collapse in Connaught Place",
    source: "Social Media News",
    sourceTrustScore: 15,
    publishedAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15 mins ago
    crossSourceAgreement: 0.1,
    relevanceScore: 0.95,
    url: "https://social-rumor.com/cp-collapse"
  },
  {
    title: "Historical Analysis of Seismic Activity in North India",
    source: "Geology Journal",
    sourceTrustScore: 85,
    publishedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(), // 7 days ago
    crossSourceAgreement: 0.9,
    relevanceScore: 0.7,
    url: "https://geojournal.org/delhi-history"
  }
];

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

// NEW: Search function using Aviral's Ranking Formula
export const executeSearch = async (req, res) => {
  const { q, isEmergency } = req.query;

  try {
    // 1. Calculate scores for all items using the formula in ranker.js
    const rankedResults = MOCK_DATA.map(item => {
      const finalScore = calculateEmergencyScore(item);
      return { 
        ...item, 
        rankingScore: finalScore,
        // Visual indicator of which part of the formula boosted it
        isHighTrust: item.sourceTrustScore > 80,
        isFresh: (new Date() - new Date(item.publishedAt)) < 3600000 
      };
    });

    // 2. Sort by the calculated score (highest first)
    rankedResults.sort((a, b) => b.rankingScore - a.rankingScore);

    res.json({
      query: q,
      emergencyMode: isEmergency === 'true',
      results: rankedResults
    });
  } catch (error) {
    console.error("SEARCH ERROR:", error);
    res.status(500).json({ message: "Ranking calculation failed" });
  }
};