import Page from '../models/Page.js';
import Feedback from '../models/Feedback.js';
import { processQuery } from '../utils/queryProcessor.js';
import { calculateBM25 } from '../services/bm25.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from '../models/QueryCorpus.js';
import { calculateEmergencyScore } from '../utils/ranker.js';
import { classifyIntent } from '../services/aiService.js';
import { liveScrape } from '../services/scraperService.js';
import axios from 'axios';

// Helper: Geolocate user for context-aware crisis info
const getUserLocation = async (ip) => {
    try {
        const cleanIp = (ip === '::1' || ip === '127.0.0.1' || !ip) ? '' : ip;
        const res = await axios.get(`http://ip-api.com/json/${cleanIp}`);
        return res.data.status === 'success' ? `${res.data.city}, ${res.data.regionName}` : "India";
    } catch (err) {
        return "India";
    }
};

// --- THE MISSING EXPORT ---
export const executeSearch = async (req, res) => {
    const { q } = req.query;
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const location = await getUserLocation(userIp);
        
        // 1. SMART QUERY PROCESSING (Fixing "Near Me")
        let effectiveQuery = q;
        if (q.toLowerCase().includes('near me')) {
            effectiveQuery = q.toLowerCase().replace('near me', `in ${location}`);
            console.log(`📍 Location Injection: "${q}" -> "${effectiveQuery}"`);
        }

        const tokens = processQuery(effectiveQuery);
        if (tokens.length === 0) return res.status(400).json({ message: "No valid tokens found" });

        // 2. INTENT & EMERGENCY CHECK
        const aiAnalysis = await classifyIntent(effectiveQuery);
        const isEmergency = aiAnalysis.isEmergency;

        // 3. RETRIEVAL STRATEGY
        // A. Try Local DB (AG News)
        let candidates = await Page.find({ tokens: { $in: tokens } }).limit(100).lean();
        let rankedResults = calculateBM25(tokens, candidates);
        let dataSource = "Local Index";

        // B. Check Quality. If poor, Scrape Live Web.
        const topResult = rankedResults[0];
        // Lowered threshold to force scrape if local results are irrelevant
        const coverage = topResult ? tokens.filter(t => topResult.tokens.includes(t)).length / tokens.length : 0;

        if (rankedResults.length < 3 || coverage < 0.4) {
            console.log(`🌐 Local results weak (${rankedResults.length} found). Scraping live...`);
            
            // Pass the LOCALISED query to the scraper
            const externalData = await liveScrape(effectiveQuery);
            
            if (externalData.length > 0) {
                dataSource = "Live Web + Local";
                const processedExternal = externalData.map(item => ({
                    ...item,
                    createdAt: new Date(),
                    tokens: processQuery(item.title + " " + item.content)
                }));

                // Combine Local + External
                const combined = [...candidates, ...processedExternal];
                
                // Re-rank everything together
                rankedResults = calculateBM25(tokens, combined);

                // Learn: Save the good external results to DB for next time
                Page.insertMany(processedExternal, { ordered: false }).catch(() => {});
            }
        }

        // 4. FEEDBACK INTEGRATION (The Learning Loop)
        const targetUrls = rankedResults.map(r => r.url);
        const feedbacks = await Feedback.find({ targetUrl: { $in: targetUrls } }).lean();

        const finalResults = rankedResults.map(r => {
            const docFeedbacks = feedbacks.filter(f => f.targetUrl === r.url);
            const totalImpact = docFeedbacks.reduce((sum, f) => sum + f.trustScoreImpact, 0);

            const hybridScore = calculateEmergencyScore(r, isEmergency, {
                impact: totalImpact,
                clicks: r.clicks || 0
            });

            return {
                title: r.title,
                url: r.url,
                summary: (r.content || "").substring(0, 200) + "...",
                score: hybridScore,
                source: r.category === 'Scraped' ? 'Live Web' : 'Local Archive',
                trustLevel: hybridScore > 75 ? "OFFICIAL" : "VERIFIED",
                feedbackCount: docFeedbacks.length // Sending this to frontend for proof
            };
        });

        // Sort by Score
        finalResults.sort((a, b) => b.score - a.score);

        // 5. Audit & Insights: Update Query Corpus
        await QueryCorpus.findOneAndUpdate(
            { phrase: q.toLowerCase().trim() },
            { 
                $inc: { frequency: 1 }, 
                $set: { lastSearched: new Date(), mode: isEmergency ? 'emergency' : 'normal' }
            },
            { upsert: true }
        );

        res.json({
            query: effectiveQuery,
            emergencyMode: isEmergency,
            aiTip: aiAnalysis.survivalTip,
            location: location,
            results: finalResults.slice(0, 15), // Show top 15 results
            meta: { 
                engine: "LifeLine Hybrid v1.6",
                tokens: tokens,
                localCoverage: `${(coverage * 100).toFixed(0)}%`
            }
        });

    } catch (error) {
        console.error("Search Error:", error.message);
        res.status(500).json({ message: "Search failed" });
    }
};