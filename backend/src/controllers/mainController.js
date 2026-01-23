import AnalyticsLog from '../models/AnalyticsLog.js';
import Feedback from '../models/Feedback.js';
import queryPredictor from '../services/ngramService.js';

export const logInteraction = async (req, res) => {
  try {
    const { sessionId, actionType, targetUrl, isEmergencyMode, duration } = req.body;
    
    // Log the action
    await AnalyticsLog.create({
      sessionId,
      actionType,
      metadata: { clickedUrl: targetUrl },
      isEmergencyMode,
      duration
    });

    console.log(`📊 Analytics: ${actionType} logged for session ${sessionId.substr(0,5)}`);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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