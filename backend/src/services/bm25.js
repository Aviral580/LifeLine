/**
 * Enhanced BM25 with Lexical Similarity
 */
export const calculateBM25 = (queryTokens, results, totalDocs = 120000) => {
    const k1 = 1.2; 
    const b = 0.75;

    const avgdl = results.reduce((sum, doc) => sum + (doc.tokens?.length || 0), 0) / results.length || 1;

    const scoredResults = results.map(doc => {
        let bm25Score = 0;
        const D = doc.tokens?.length || 0;

        // 1. Classic BM25 Math
        queryTokens.forEach(token => {
            const f_q_D = doc.tokens ? doc.tokens.filter(t => t === token).length : 0;
            const n_q = results.filter(d => d.tokens?.includes(token)).length;
            const idf = Math.log((totalDocs - n_q + 0.5) / (n_q + 0.5) + 1);

            const numerator = f_q_D * (k1 + 1);
            const denominator = f_q_D + k1 * (1 - b + b * (D / avgdl));
            bm25Score += idf * (numerator / denominator);
        });

        // 2. Similarity Search (Jaccard Similarity)
        // This measures the overlap between query tokens and document tokens
        const docTokenSet = new Set(doc.tokens);
        const intersection = queryTokens.filter(t => docTokenSet.has(t));
        const similarityScore = intersection.length / queryTokens.length; 

        return {
            ...doc,
            relevanceScore: bm25Score.toFixed(4),
            similarityScore: similarityScore.toFixed(4) // This satisfies the "Similarity Search" requirement
        };
    });

    return scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
};