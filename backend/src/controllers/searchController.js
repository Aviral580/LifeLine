import ngramService from '../services/ngramService.js';
import AnalyticsLog from '../models/AnalyticsLog.js';

// GET /api/search/predict?q=...
export const getPredictions = async (req, res) => {
  const { q } = req.query;
  
  // 1. Get Suggestions from NLP Service
  const suggestions = await ngramService.predict(q);

  // 2. LOG THE OUTPUT (This is what you asked for)
  // This will show exactly what list is being sent to the frontend
  if (suggestions.length > 0) {
      console.log(`📤 SENDING to Frontend: [ ${suggestions.join(', ')} ]`);
  } else {
      console.log(`⚠️ SENDING EMPTY LIST (No matches found)`);
  }

  res.json({ suggestions });
};

// POST /api/search/log
export const logSearch = async (req, res) => {
  const { query, sessionId, isEmergencyMode } = req.body;
  
  console.log(`📝 Logging Search: "${query}" (Emergency: ${isEmergencyMode})`);
  
  try {
    // Log to Analytics DB
    await AnalyticsLog.create({ 
        sessionId, 
        actionType: 'search', 
        targetUrl: 'search_query', 
        isEmergencyMode,
        query 
    });
    
    // Train NLP Model if query is valid
    if(query && query.length > 2) {
        await ngramService.learn(query, isEmergencyMode ? 'emergency' : 'general');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Log Error:", error);
    res.status(500).json({ success: false });
  }
};