import ngramService from '../services/ngramService.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
export const getPredictions = (req, res) => {
  const { q } = req.query;
  const suggestions = ngramService.predict(q);
  res.json({ suggestions });
};
export const logSearch = async (req, res) => {
  const { query, sessionId, isEmergencyMode } = req.body;
  await AnalyticsLog.create({
    sessionId,
    actionType: 'search',
    query,
    isEmergencyMode
  });
  if (query && query.length > 3) {
    const category = isEmergencyMode ? 'emergency' : 'general';
    ngramService.learn(query, category).catch(console.error);
  }
  res.json({ success: true });
};