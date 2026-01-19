import { fetchNewsFromNewsAPI } from "../services/serpApiService.js";
import { detectEmergencyIntent } from "../services/emergencyIntentService.js";
import AnalyticsLog from "../models/AnalyticsLog.js";

export const searchNews = async (req, res) => {
  try {
    const { q, page = 1, pageSize = 10, sources, language = "en", from, to } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Query missing" });
    }

    const intentResult = await detectEmergencyIntent(q);

    const finalSources = intentResult.intent === "emergency"
      ? "who.int,cdc.gov,nih.gov"
      : sources;

    const { articles, totalResults } = await fetchNewsFromNewsAPI(q, {
      page,
      pageSize,
      sources: finalSources,
      language,
      from,
      to,
    });

    await AnalyticsLog.create({
      sessionId: req.headers["x-session-id"] || "unknown-session",
      actionType: "search",
      query: q,
      targetUrl: "search_query",
      isEmergencyMode: intentResult.intent === "emergency",
    });

    res.status(200).json({
      success: true,
      intent: intentResult,
      page: Number(page),
      pageSize: Number(pageSize),
      totalResults,
      count: articles.length,
      articles,
    });

  } catch (err) {
    console.error("News fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};
