import { getEmbedding } from "./semanticService.js";
import { SUPER_SEED_QUERIES } from "../utils/superSeed.js";

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (normA * normB);
}

export async function detectEmergencyIntent(query) {
  const queryLower = query.toLowerCase();

  /* ---------- 1️⃣ KEYWORD SIGNAL ---------- */
  const keywordHit = SUPER_SEED_QUERIES.some(p =>
    queryLower.includes(p)
  );

  let keywordScore = keywordHit ? 0.6 : 0;

  /* ---------- 2️⃣ SEMANTIC SIGNAL ---------- */
  let semanticScore = 0;

  try {
    const queryEmbedding = await getEmbedding(query);

    const similarities = await Promise.all(
      SUPER_SEED_QUERIES.map(async phrase => {
        const emb = await getEmbedding(phrase);
        return cosineSimilarity(queryEmbedding, emb);
      })
    );

    semanticScore = Math.max(...similarities); // best match
  } catch {
    semanticScore = 0;
  }

  /* ---------- 3️⃣ SCORE FUSION ---------- */
  const finalScore = keywordScore + semanticScore * 0.6;

  const intent =
    finalScore > 0.75 ? "emergency" : "normal";

  return {
    intent,
    confidence: Number(finalScore.toFixed(2)),
    signals: {
      keyword: keywordScore,
      semantic: semanticScore
    }
  };
}
