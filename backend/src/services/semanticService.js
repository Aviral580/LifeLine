import OpenAI from "openai";
import Feedback from "../models/Feedback.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ================== EMBEDDING ==================
export async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

// ================== SIMILARITY ==================
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

// ================== MAIN RANKING ==================
export async function rankArticles(query, articles) {
  if (!articles || articles.length === 0) return [];

  try {
    const queryEmbedding = await getEmbedding(query);

    const ranked = await Promise.all(
      articles.map(async (article) => {
        const text = `${article.title} ${article.description || ""}`;
        const embedding = await getEmbedding(text);

        // 1️⃣ Semantic relevance
        const similarity = cosineSimilarity(queryEmbedding, embedding);

        // 2️⃣ Freshness
        const daysOld =
          (Date.now() - new Date(article.publishedAt)) /
          (1000 * 60 * 60 * 24);
        const freshness = Math.max(0, 1 - daysOld / 30);

        // 3️⃣ Source credibility
        const credibleSources = [
          "who.int",
          "cdc.gov",
          "nih.gov",
          "healthline.com",
        ];

        const credibility = credibleSources.some((src) =>
          article.url?.includes(src)
        )
          ? 1
          : 0.5;

        // 4️⃣ Feedback trust impact
        const feedbacks = await Feedback.find({ targetUrl: article.url });
        const feedbackImpact = feedbacks.reduce(
          (sum, f) => sum + (f.trustScoreImpact || 0),
          0
        );

        // 5️⃣ Final score
        const score =
          similarity * 0.55 +
          freshness * 0.25 +
          credibility * 0.2 +
          feedbackImpact;

        return {
          ...article,
          trustScore: Math.round(score * 100),
        };
      })
    );

    return ranked.sort((a, b) => b.trustScore - a.trustScore);
  } catch (error) {
    console.warn("Semantic ranking failed, fallback used.");
    return articles;
  }
}
