import Page from '../models/Page.js';
import Feedback from '../models/Feedback.js';
import { processQuery } from '../utils/queryProcessor.js';
import { calculateBM25 } from '../services/bm25.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from '../models/QueryCorpus.js';
import { calculateEmergencyScore } from '../utils/ranker.js';
import { classifyIntent } from '../services/aiService.js';
import { liveScrape } from '../services/scraperService.js';
import vectorService from '../services/vectorService.js'; // LOCAL VECTOR SERVICE
import { cosineSimilarity } from '../utils/math.js'; // MANUAL MATH
import axios from 'axios';

const getUserLocation = async (ip) => {
    try {
        const cleanIp = (ip === '::1' || ip === '127.0.0.1' || !ip) ? '' : ip;
        const res = await axios.get(`http://ip-api.com/json/${cleanIp}`);
        return res.data.status === 'success' ? `${res.data.city}, ${res.data.regionName}` : "India";
    } catch (err) { return "India"; }
};

export const executeSearch = async (req, res) => {
    const { q } = req.query;
    const startTime = Date.now();

    try {
        const location = await getUserLocation(req.headers['x-forwarded-for']);
        const aiAnalysis = await classifyIntent(q);
        const isEmergency = aiAnalysis.isEmergency;
        const queryVectorPromise = vectorService.getEmbedding(q);
        const tokens = processQuery(q);
        let candidates = await Page.find({ tokens: { $in: tokens } }).limit(50).lean();
        if (candidates.length < 5) {
            const externalData = await liveScrape(q);
            if (externalData.length > 0) {
                const processedExternal = externalData.map(item => ({
                    ...item,
                    category: 'Scraped',
                    createdAt: new Date(),
                    tokens: processQuery(item.title + " " + item.content)
                }));
                candidates = [...candidates, ...processedExternal];
            }
        }
        const queryVector = await queryVectorPromise;
        let rankedResults = calculateBM25(tokens, candidates);

        const targetUrls = rankedResults.map(r => r.url);
        const feedbacks = await Feedback.find({ targetUrl: { $in: targetUrls } }).lean();
        
        // --- ONLY THIS SECTION UPDATED TO MATCH NEW ANALYTICS ---
        const analytics = await AnalyticsLog.aggregate([
            { $match: { "metadata.clickedUrl": { $in: targetUrls } } },
            { $group: { 
                _id: "$metadata.clickedUrl", 
                clicks: { $sum: { $cond: [{ $eq: ["$actionType", "click_result"] }, 1, 0] } }, 
                bounces: { $sum: { $cond: [{ $eq: ["$actionType", "bounce_detected"] }, 1, 0] } } 
            }}
        ]);

        const finalResults = await Promise.all(rankedResults.map(async (r, index) => {
            let semanticScore = 0;

            if (queryVector && index < 20) {
                const docText = `${r.title} ${r.summary || r.content.substring(0, 100)}`;
                const docVector = await vectorService.getEmbedding(docText);
                if (docVector) {
                    semanticScore = cosineSimilarity(queryVector, docVector);
                }
            }
            const docFeedbacks = feedbacks.filter(f => f.targetUrl === r.url);
            const docAnalytics = analytics.find(a => a._id === r.url) || { clicks: 0, bounces: 0 };
            const totalImpact = docFeedbacks.reduce((sum, f) => sum + f.trustScoreImpact, 0);

            const hybridScore = calculateEmergencyScore(r, isEmergency, {
                impact: totalImpact,
                clicks: docAnalytics.clicks,
                bounces: docAnalytics.bounces,
                semanticScore: semanticScore
            });

            return {
                title: r.title,
                url: r.url,
                summary: (r.content || "").substring(0, 200) + "...",
                score: hybridScore,
                source: r.category === 'Scraped' ? 'Live Web' : 'Local Archive',
                trustLevel: hybridScore > 75 ? "OFFICIAL" : "VERIFIED",
                feedbackCount: docFeedbacks.length,
                debugVector: semanticScore.toFixed(2) // Sending this to frontend to PROVE it works
            };
        }));

        finalResults.sort((a, b) => b.score - a.score);

        // Update N-Gram
        await QueryCorpus.findOneAndUpdate(
            { phrase: q.toLowerCase().trim() },
            { $inc: { frequency: 1 }, $set: { lastSearched: new Date() } },
            { upsert: true }
        );

        res.json({
            query: q,
            emergencyMode: isEmergency,
            aiTip: aiAnalysis.survivalTip,
            location: location,
            results: finalResults.slice(0, 15),
            meta: { 
                engine: "LifeLine Local-Vector v1.0",
                searchTime: `${Date.now() - startTime}ms`,
                vectorUsed: !!queryVector
            }
        });

    } catch (error) {
        console.error("Search Logic Error:", error);
        res.status(500).json({ message: "Internal Engine Failure" });
    }
};