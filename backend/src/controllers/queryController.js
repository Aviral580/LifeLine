import ngramService from '../services/ngramService.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from "../models/QueryCorpus.js";

export const getPredictions = async (req, res) => {
  const { q } = req.query;
  const suggestions = await ngramService.predict(q);

  if (suggestions.length > 0) {
    console.log(`SENDING to Frontend: [ ${suggestions.join(', ')} ]`);
  } else {
    console.log(`SENDING EMPTY LIST (No matches found)`);
  }

  res.json({ suggestions });
};

export const logSearch = async (req, res) => {
  const { query, sessionId, isEmergencyMode } = req.body;

  console.log(`Logging Search: "${query}" (Emergency: ${isEmergencyMode})`);

  try {
    await AnalyticsLog.create({
      sessionId,
      actionType: 'search',
      targetUrl: 'search_query',
      isEmergencyMode,
      query
    });

    if (query && query.length > 2) {
      await ngramService.learn(
        query,
        isEmergencyMode ? 'emergency' : 'general'
      );
    }

    // 🔥 NEW: Update MongoDB query corpus
    await QueryCorpus.findOneAndUpdate(
      { phrase: query },
      {
        $inc: { frequency: 1 },
        $set: { lastSearched: Date.now(), category: isEmergencyMode ? 'emergency' : 'general' }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Log Error:", error);
    res.status(500).json({ success: false });
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const { q = "" } = req.query;

    const suggestions = await QueryCorpus.find({
      phrase: { $regex: "^" + q, $options: "i" },
    })
      .sort({ frequency: -1, lastSearched: -1 })
      .limit(5);

    res.status(200).json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
};
