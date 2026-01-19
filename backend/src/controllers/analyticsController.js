import AnalyticsLog from "../models/AnalyticsLog.js";

export const logClick = async (req, res) => {
  try {
    const { sessionId, query, targetUrl, isEmergencyMode } = req.body;

    await AnalyticsLog.create({
      sessionId,
      actionType: "click_result",
      query,
      targetUrl,
      isEmergencyMode,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to log click" });
  }
};

export const logFeedback = async (req, res) => {
  try {
    const { sessionId, query, targetUrl, feedbackType, isEmergencyMode } = req.body;

    const actionType =
      feedbackType === "helpful" ? "feedback_helpful" : "feedback_fake";

    await AnalyticsLog.create({
      sessionId,
      actionType,
      query,
      targetUrl,
      isEmergencyMode,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to log feedback" });
  }
};

export const logEvent = async (req, res) => {
  try {
    const { sessionId, actionType, query, targetUrl, timeSpentSeconds, isEmergencyMode } = req.body;

    await AnalyticsLog.create({
      sessionId,
      actionType,
      query,
      targetUrl,
      timeSpentSeconds,
      isEmergencyMode,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to log event" });
  }
};
