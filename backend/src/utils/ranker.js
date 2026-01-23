import { verifySourceAuthority } from './trustValidator.js';

export const calculateEmergencyScore = (result, isEmergency = false, userSignals = {}) => {
    const relevance = Math.min((parseFloat(result.relevanceScore) || 0) / 40, 1.0);
    const authority = verifySourceAuthority(result.url) / 100;

    // --- FRESHNESS LOGIC UPGRADE ---
    const pubDateRaw = result.publishedAt || result.createdAt || "";
    let hoursOld = 175200; // Default to ~20 years old (2004 data)
    
    if (pubDateRaw) {
        const docDate = new Date(pubDateRaw);
        if (!isNaN(docDate)) {
            hoursOld = (new Date() - docDate) / (1000 * 60 * 60);
        }
    }

    // Heavy penalty for the 2004 AG News data
    let freshness = 0.05; 
    if (hoursOld <= 24) freshness = 1.0;       // Last 24 hours
    else if (hoursOld <= 168) freshness = 0.7; // Last week
    else if (hoursOld <= 720) freshness = 0.4; // Last month
    else if (hoursOld > 8760) freshness = -0.5; // Older than a year? Penalty.

    // --- USER BEHAVIOR ---
    const feedbackImpact = userSignals.impact || 0;
    const clickCount = userSignals.clicks || 0;
    const behaviorScore = (clickCount * 0.05) + (feedbackImpact * 0.2);

    // --- SOURCE WEIGHTING ---
    // If it's from the scraper (Live Web), give it a "Freshness" floor boost
    const sourceBoost = result.source === 'Live Web' ? 0.2 : 0;

    let finalScore;
    if (isEmergency) {
        finalScore = (authority * 0.35) + (freshness * 0.35) + (behaviorScore * 0.20) + (relevance * 0.10);
    } else {
        // NORMAL MODE: Prioritize relevance BUT heavily weight freshness to avoid 2004 data
        finalScore = (relevance * 0.30) + (freshness * 0.40) + (authority * 0.15) + (behaviorScore * 0.15) + sourceBoost;
    }

    return parseFloat((Math.max(0, finalScore) * 100).toFixed(2));
};