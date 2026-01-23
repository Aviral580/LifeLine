import AnalyticsLog from '../models/AnalyticsLog.js';
import Feedback from '../models/Feedback.js';
import queryPredictor from '../services/ngramService.js';

export const logInteraction = async (req, res) => {
  try {
    const { sessionId, actionType, targetUrl, isEmergencyMode, duration, query } = req.body;
    
    // We map the incoming data to match the Schema's structure exactly
    const logData = {
      sessionId: sessionId || "session-unknown",
      actionType,
      isEmergencyMode: !!isEmergencyMode,
      query: query || null,
      duration: duration || 0,
      metadata: {
        clickedUrl: targetUrl || null // Move targetUrl into metadata
      }
    };

    await AnalyticsLog.create(logData);

    // Visual Terminal Confirmation
    if (actionType === 'bounce_detected') {
      console.log(`🛑 POGO-STICK CAUGHT: ${targetUrl} (Stayed: ${duration}ms)`);
    } else {
      console.log(`📊 Analytics: ${actionType} logged`);
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("❌ Log Interaction Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ... keep submitFeedback, getPredictions, and getDashboardMetrics as they are ...

export const submitFeedback = async (req, res) => {
  try {
    const { targetUrl, feedbackType, userComment } = req.body;
    
    console.log(`🗣️ Feedback Received: ${feedbackType} for ${targetUrl}`);

    let impact = 0;
    if (feedbackType === 'upvote') impact = 5; // Increased weight for testing visibility
    if (feedbackType === 'downvote') impact = -2;
    if (feedbackType === 'fake_news_report') impact = -20; // Massive penalty

    const feedback = await Feedback.create({
      targetUrl,
      feedbackType,
      userComment,
      trustScoreImpact: impact
    });

    res.status(201).json({ 
      success: true, 
      message: "Feedback recorded", 
      newImpact: impact 
    });
  } catch (error) {
    console.error("Feedback Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ... keep getPredictions and getDashboardMetrics as they were ...
export const getPredictions = (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ suggestions: [] });
  const suggestions = queryPredictor.predict(q);
  res.json({ suggestions });
};

export const getDashboardMetrics = async (req, res) => {
  try {
    const ctrStats = await AnalyticsLog.aggregate([
      { $match: { actionType: 'click_result' } },
      { $group: { _id: "$metadata.clickedUrl", clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 5 }
    ]);
    res.json({ ctrStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};