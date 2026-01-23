import { verifySourceAuthority } from './trustValidator.js';

export const calculateEmergencyScore = (result, isEmergency = false, userSignals = {}) => {
    // 1. BASE RELEVANCE
    const relevance = Math.min((parseFloat(result.relevanceScore) || 0) / 40, 1.0);
    const authority = verifySourceAuthority(result.url) / 100;

    // 2. FRESHNESS (Existing logic preserved)
    const pubDateRaw = result.publishedAt || result.createdAt || "";
    let hoursOld = 175200; 
    
    if (pubDateRaw) {
        const docDate = new Date(pubDateRaw);
        if (!isNaN(docDate)) {
            hoursOld = (new Date() - docDate) / (1000 * 60 * 60);
        }
    }

    let freshness = 0.05; 
    if (hoursOld <= 24) freshness = 1.0;       
    else if (hoursOld <= 168) freshness = 0.7; 
    else if (hoursOld <= 720) freshness = 0.4; 
    else if (hoursOld > 8760) freshness = -0.5; 

    // --- BEHAVIORAL & SEMANTIC LOGIC ---
    const clicks = userSignals.clicks || 0;
    const bounces = userSignals.bounces || 0;
    const totalInteractions = clicks + bounces;
    const bounceRate = totalInteractions > 0 ? (bounces / totalInteractions) : 0;

    const feedbackImpact = userSignals.impact || 0;
    const feedbackScore = feedbackImpact * 2.0; 

    // NEW: Semantic (Vector) Score - Passed from searchController
    const semanticScore = userSignals.semanticScore || 0;

    // Source Boost
    const sourceBoost = result.source === 'Live Web' ? 0.2 : 0;

    let finalScore;
    if (isEmergency) {
        // Emergency: Prioritize Authority, Freshness, and Semantic accuracy.
        finalScore = 
            (authority * 0.30) + 
            (freshness * 0.30) + 
            (semanticScore * 0.20) + // AI accuracy factor
            (relevance * 0.10) + 
            (feedbackScore / 100) - 
            (bounceRate * 0.25);
    } else {
        // Normal: Relevance + Semantic + Freshness
        finalScore = 
            (relevance * 0.25) + 
            (semanticScore * 0.25) + // AI accuracy factor
            (freshness * 0.30) + 
            (authority * 0.10) + 
            (feedbackScore / 100) - 
            (bounceRate * 0.15) + 
            sourceBoost;
    }

    // Clamp between 0 and 100
    return parseFloat((Math.max(0, Math.min(100, finalScore * 100))).toFixed(2));
};