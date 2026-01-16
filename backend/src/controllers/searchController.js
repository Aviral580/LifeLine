
import ngramService from '../services/ngramService.js';

import AnalyticsLog from '../models/AnalyticsLog.js';



// GET /api/predict?q=flo

export const getPredictions = (req, res) => {

  const { q } = req.query;

  const suggestions = ngramService.predict(q);

  res.json({ suggestions });

};



// POST /api/search/log

// Call this when user actually hits "Enter" on a search

export const logSearch = async (req, res) => {

  const { query, sessionId, isEmergencyMode } = req.body;

  

  // 1. Log the analytics

  await AnalyticsLog.create({

    sessionId,

    actionType: 'search',

    query,

    isEmergencyMode

  });



  // 2. Teach the NLP model this new query (Continuous Learning)

  // We only learn if it's a valid, non-spam query (simple length check here)

  if (query && query.length > 3) {

    const category = isEmergencyMode ? 'emergency' : 'general';

    // Run asynchronously so we don't slow down the response

    ngramService.learn(query, category).catch(console.error);

  }



  res.json({ success: true });

};

