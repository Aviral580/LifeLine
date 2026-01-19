import axios from "axios";
import QueryCorpus from "../models/QueryCorpus.js";
import AnalyticsLog from "../models/AnalyticsLog.js";

const NEWS_API_KEY = process.env.NEWS_API_KEY;

const HEALTH_SOURCES = [
  "who.int",
  "cdc.gov",
  "nih.gov",
  "healthline.com",
  "mayoclinic.org",
  "webmd.com",
  "medlineplus.gov",
  "nhs.uk",
  "verywellhealth.com",
  "medscape.com"
];

const isHealthSource = (source) => {
  if (!source) return false;
  return HEALTH_SOURCES.some((s) => source.toLowerCase().includes(s));
};

export const fetchNewsFromNewsAPI = async (query, options = {}) => {
  const { page = 1, pageSize = 10, language = "en", sources, from, to } = options;

  const finalDomains = sources && isHealthSource(sources)
    ? sources
    : HEALTH_SOURCES.join(",");

  const boostedQuery = `${query} OR health OR medical OR symptoms OR disease OR treatment OR diagnosis`;

  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: boostedQuery,
        language,
        page,
        pageSize,
        domains: finalDomains,
        from,
        to,
        apiKey: NEWS_API_KEY,
      },
    });

    const articles = response.data.articles || [];

    const rankedArticles = await applyRanking(articles);

    return {
      articles: rankedArticles,
      totalResults: response.data.totalResults || rankedArticles.length,
    };
  } catch (err) {
    console.error("NewsAPI Error:", err.response?.data || err.message);
    throw err;
  }
};

export const getSuggestions = async (prefix) => {
  if (!prefix) return [];

  try {
    const suggestions = await QueryCorpus.find({
      phrase: { $regex: `^${prefix}`, $options: "i" },
    }).limit(5);

    return suggestions.map((doc) => doc.phrase);
  } catch (err) {
    console.error("Error fetching suggestions:", err.message);
    return [];
  }
};

const applyRanking = async (articles) => {
  const urls = articles.map(a => a.url);

  const logs = await AnalyticsLog.aggregate([
    { $match: { targetUrl: { $in: urls } } },
    {
      $group: {
        _id: "$targetUrl",
        clicks: { $sum: { $cond: [{ $eq: ["$actionType", "click_result"] }, 1, 0] } },
        helpful: { $sum: { $cond: [{ $eq: ["$actionType", "feedback_helpful"] }, 1, 0] } },
        fake: { $sum: { $cond: [{ $eq: ["$actionType", "feedback_fake"] }, 1, 0] } },
        bounces: { $sum: { $cond: [{ $eq: ["$actionType", "bounce"] }, 1, 0] } },
        timeSpent: { $sum: { $cond: [{ $eq: ["$actionType", "time_on_page"] }, "$timeSpentSeconds", 0] } }
      }
    }
  ]);

  const scoreMap = {};
  logs.forEach(log => {
    scoreMap[log._id] =
      (log.clicks * 2) +
      (log.helpful * 5) -
      (log.fake * 7) -
      (log.bounces * 3) +
      (log.timeSpent / 10);
  });

  const agreementScores = computeCrossSourceAgreement(articles);

  return articles
    .map(a => ({
      ...a,
      _feedbackScore: scoreMap[a.url] || 0,
      _agreementScore: agreementScores[a.url] || 0
    }))
    .sort((a, b) => {
      const aScore = a._feedbackScore + a._agreementScore * 2;
      const bScore = b._feedbackScore + b._agreementScore * 2;
      return bScore - aScore;
    });
};

const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .filter(word => word.length > 3);
};

const computeCrossSourceAgreement = (articles) => {
  const normalized = articles.map(a => ({
    url: a.url,
    tokens: new Set(normalizeText(a.title + " " + a.description))
  }));

  const agreementScore = {};
  normalized.forEach((a, i) => {
    let count = 0;
    for (let j = 0; j < normalized.length; j++) {
      if (i === j) continue;
      const b = normalized[j];

      const intersection = [...a.tokens].filter(x => b.tokens.has(x)).length;
      const union = new Set([...a.tokens, ...b.tokens]).size;
      const jaccard = union === 0 ? 0 : intersection / union;

      if (jaccard > 0.35) count++;
    }
    agreementScore[a.url] = count;
  });

  return agreementScore;
};
