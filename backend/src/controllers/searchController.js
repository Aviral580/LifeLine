import ngramService from '../services/ngramService.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
export const getPredictions = async (req, res) => {
  const { q } = req.query;
  const suggestions = await ngramService.predict(q);
  if (suggestions.length > 0) {
      console.log(` SENDING to Frontend: [ ${suggestions.join(', ')} ]`);
  } else {
      console.log(`️ SENDING EMPTY LIST (No matches found)`);
  }
  res.json({ suggestions });
};
export const logSearch = async (req, res) => {
  const { query, sessionId, isEmergencyMode } = req.body;
  console.log(` Logging Search: "${query}" (Emergency: ${isEmergencyMode})`);
  try {
    await AnalyticsLog.create({ 
        sessionId, 
        actionType: 'search', 
        targetUrl: 'search_query', 
        isEmergencyMode,
        query 
    });
    if(query && query.length > 2) {
        await ngramService.learn(query, isEmergencyMode ? 'emergency' : 'general');
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Log Error:", error);
    res.status(500).json({ success: false });
  }
};