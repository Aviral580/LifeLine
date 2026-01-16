import ngramService from '../services/ngramService.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
export const getPredictions = (req, res) => {
  const { q } = req.query;
  console.log(` Predicting for: "${q}"`); 
  const suggestions = ngramService.predict(q);
  res.json({ suggestions });
};
export const logSearch = async (req, res) => {
  const { query, sessionId, isEmergencyMode } = req.body;
  console.log(` Logging Search: "${query}" (Emergency: ${isEmergencyMode})`);
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
};