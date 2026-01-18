import AnalyticsLog from '../models/AnalyticsLog.js';
import Feedback from '../models/Feedback.js';
import queryPredictor from '../services/ngramService.js';

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

export const submitFeedback = async (req, res) => {
  try {
    const { targetUrl, feedbackType, userComment } = req.body;

    let impact = 0;
    if (feedbackType === 'upvote') impact = 1;
    if (feedbackType === 'downvote') impact = -1;
    if (feedbackType === 'fake_news_report') impact = -5;

    await Feedback.create({
      targetUrl,
      feedbackType,
      userComment,
      trustScoreImpact: impact
    });

    res.status(201).json({
      success: true,
      message: "Feedback integrated into ranking loop."
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPredictions = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ suggestions: [] });

  const suggestions = await queryPredictor.predict(q);
  res.json({ suggestions });
};

export const getDashboardMetrics = async (req, res) => {
  try {
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
