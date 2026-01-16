import AnalyticsLog from '../models/AnalyticsLog.js';
import Feedback from '../models/Feedback.js';
import queryPredictor from '../services/ngramService.js';

// @desc    Log user interaction (CTR, Bounce)
// @route   POST /api/analytics/log
export const logInteraction = async (req, res) => {
  try {
    const { sessionId, actionType, targetUrl, isEmergencyMode, duration } = req.body;
    
    const log = await AnalyticsLog.create({
      sessionId,
      actionType,
      targetUrl,
      isEmergencyMode,
      duration
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit Feedback (Feedback Loop)
// @route   POST /api/feedback
export const submitFeedback = async (req, res) => {
  try {
    const { targetUrl, feedbackType, userComment } = req.body;

    [cite_start]// Logic: Calculate trust impact [cite: 52]
    let impact = 0;
    if (feedbackType === 'upvote') impact = 1;
    if (feedbackType === 'downvote') impact = -1;
    if (feedbackType === 'fake_news_report') impact = -5; // Heavy penalty

    const feedback = await Feedback.create({
      targetUrl,
      feedbackType,
      userComment,
      trustScoreImpact: impact
    });

    res.status(201).json({ success: true, message: "Feedback integrated into ranking loop." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Next-Word Predictions
// @route   GET /api/predict?q=...
export const getPredictions = (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ suggestions: [] });

  const suggestions = queryPredictor.predict(q);
  res.json({ suggestions });
};

// @desc    Get Aggregated Analytics (For Dashboard)
// @route   GET /api/analytics/dashboard
export const getDashboardMetrics = async (req, res) => {
  try {
    [cite_start]// Aggregation Pipeline for CTR [cite: 13]
    const ctrStats = await AnalyticsLog.aggregate([
      { $match: { actionType: 'click_result' } },
      { $group: { _id: "$targetUrl", clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 5 }
    ]);

    res.json({ ctrStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
