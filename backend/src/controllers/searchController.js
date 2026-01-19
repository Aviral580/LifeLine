import ngramService from '../services/ngramService.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from '../models/QueryCorpus.js';

export const getPredictions = async (req, res) => {
  const { q } = req.query;
  const suggestions = await ngramService.predict(q);
  if (suggestions.length > 0) {
    console.log(` SENDING to Frontend: [ ${suggestions.join(', ')} ]`);
  } else {
    console.log(` SENDING EMPTY LIST (No matches found)`);
  }
  res.json({ suggestions });
};

export const logSearch = async (req, res) => {
  const { query, sessionId, isEmergencyMode } = req.body;
  console.log("--- DEBUG START ---");
  console.log("Incoming Query:", query);

  try {
    // 1. Fetch ALL emergency keywords to see if they exist in DB
    const emergencyDocs = await QueryCorpus.find({ category: 'emergency' });
    const emergencyKeywords = emergencyDocs.map(doc => doc.phrase.toLowerCase());
    
    console.log("Keywords in DB:", emergencyKeywords);

    // 2. Normalize and check
    const lowerQuery = query.toLowerCase();
    const isAutoEmergency = emergencyKeywords.some(key => {
      const match = lowerQuery.includes(key);
      if (match) console.log(`MATCH FOUND: "${key}" is in "${lowerQuery}"`);
      return match;
    });

    console.log("Final autoTriggerEmergency Result:", isAutoEmergency);
    console.log("--- DEBUG END ---");

    // 3. Create the analytics log
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
    if (!res.headersSent) {
      res.status(500).json({ success: false });
    }
  }
};