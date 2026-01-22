import { verifySourceAuthority } from './trustValidator.js';

export const calculateEmergencyScore = (result, isEmergency = false) => {
    // Relevance normalized (0-1)
    const relevance = Math.min((parseFloat(result.relevanceScore) || 0) / 40, 1.0);
    
    // Authority (PageRank Proxy)
    const authority = verifySourceAuthority(result.url) / 100;

    // Freshness Logic
    const pubDateRaw = result.publishedAt || "";
    let hoursOld = 48;

    if (typeof pubDateRaw === 'string') {
        if (pubDateRaw.includes('hour')) hoursOld = parseInt(pubDateRaw) || 1;
        else if (pubDateRaw.includes('minute')) hoursOld = 0.5;
        else if (pubDateRaw.includes('day')) hoursOld = (parseInt(pubDateRaw) || 1) * 24;
        else {
            const pubDate = new Date(pubDateRaw);
            if (!isNaN(pubDate)) hoursOld = (new Date() - pubDate) / (1000 * 60 * 60);
        }
    }

    let freshness = (hoursOld <= 1) ? 1.0 : (hoursOld <= 6) ? 0.8 : (hoursOld <= 24) ? 0.5 : 0.1;

    // Consensus (The crossSourceAgreement from teammates)
    const agreement = result.crossSourceAgreement || 0.5;

    // Final Weighted Score (IR Model)
    let finalScore;
    if (isEmergency) {
        finalScore = (relevance * 0.25) + (authority * 0.35) + (freshness * 0.30) + (agreement * 0.10);
    } else {
        finalScore = (relevance * 0.60) + (authority * 0.30) + (freshness * 0.10);
    }

    return parseFloat((finalScore * 100).toFixed(2));
};