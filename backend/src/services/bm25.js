/**
 * BM25 Logic for LifeLine Search Engine
 */
export const calculateBM25 = (queryTokens, results, totalDocs = 120000) => {
    // Parameters (Standard industry values)
    const k1 = 1.2; 
    const b = 0.75;

    // 1. Calculate Average Document Length (avgdl)
    const avgdl = results.reduce((sum, doc) => sum + doc.tokens.length, 0) / results.length || 1;

    // 2. Score each document
    const scoredResults = results.map(doc => {
        let score = 0;
        const D = doc.tokens.length; // Document length

        queryTokens.forEach(token => {
            // f(q, D): Frequency of the token in this document
            const f_q_D = doc.tokens.filter(t => t === token).length;

            // n(q): Number of documents containing the token 
            // (We estimate this from the current result set for speed)
            const n_q = results.filter(d => d.tokens.includes(token)).length;

            // IDF: Inverse Document Frequency
            const idf = Math.log((totalDocs - n_q + 0.5) / (n_q + 0.5) + 1);

            // The BM25 Formula
            const numerator = f_q_D * (k1 + 1);
            const denominator = f_q_D + k1 * (1 - b + b * (D / avgdl));
            
            score += idf * (numerator / denominator);
        });

        return {
            ...doc,
            relevanceScore: score.toFixed(4)
        };
    });

    // 3. Sort by Score descending
    return scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
};