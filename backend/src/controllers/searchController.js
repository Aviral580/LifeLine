import Page from '../models/Page.js';
import { processQuery } from '../utils/queryProcessor.js';
import { calculateBM25 } from '../services/bm25.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from '../models/QueryCorpus.js';
import { calculateEmergencyScore } from '../utils/ranker.js';
import { classifyIntent } from '../services/aiService.js';
import { liveScrape } from '../services/scraperService.js'; // Back to our custom scraper
import axios from 'axios';

// Keeping the teammates' helpful location helper
const getUserLocation = async (ip) => {
    try {
        const cleanIp = (ip === '::1' || ip === '127.0.0.1' || !ip) ? '' : ip;
        const res = await axios.get(`http://ip-api.com/json/${cleanIp}`);
        return res.data.status === 'success' ? `${res.data.city}, ${res.data.regionName}` : "India";
    } catch (err) {
        return "India";
    }
};

export const executeSearch = async (req, res) => {
    const { q } = req.query;
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const tokens = processQuery(q);
        if (tokens.length === 0) return res.status(400).json({ message: "No valid tokens found" });

        // 1. Context Awareness
        const aiAnalysis = await classifyIntent(q);
        const isEmergency = aiAnalysis.isEmergency;
        const location = await getUserLocation(userIp);

        // 2. LOCAL BM25 FIRST (Our Core Rule)
        let candidates = await Page.find({ tokens: { $in: tokens } }).limit(150).lean();
        let rankedResults = calculateBM25(tokens, candidates);
        let dataSource = "Local Index (LifeLine)";

        // 3. FALLBACK TO OUR CUSTOM SCRAPER (No SerpAPI)
        const topResult = rankedResults[0];
        const coverage = topResult ? tokens.filter(t => topResult.tokens.includes(t)).length / tokens.length : 0;

        if (rankedResults.length === 0 || coverage < 0.6) {
            console.log("⚠️ Local coverage low. Triggering Custom Puppeteer/Cheerio Scraper...");
            
            const externalData = await liveScrape(q); // Using your custom service
            
            if (externalData.length > 0) {
                dataSource = "Live Web (Freshly Scraped)";
                const processedExternal = externalData.map(item => ({
                    ...item,
                    createdAt: new Date(),
                    tokens: processQuery(item.title + " " + item.content)
                }));

                // Rank the scraped data using OUR BM25 math
                rankedResults = calculateBM25(tokens, processedExternal);

                // Self-Learning: Save to DB
                Page.insertMany(processedExternal).catch(() => {});
            }
        }

        // 4. HYBRID IR RANKING (Similarity + PageRank + Freshness)
        const finalResults = rankedResults.map(r => {
            const hybridScore = calculateEmergencyScore(r, isEmergency);
            return {
                title: r.title,
                url: r.url,
                summary: (r.content || "").substring(0, 200) + "...",
                score: hybridScore,
                source: dataSource,
                trustLevel: hybridScore > 75 ? "Official" : "Verified"
            };
        });

        finalResults.sort((a, b) => b.score - a.score);

        // 5. UPDATE QUERY CORPUS (Teammate feature, but used for our insights)
        await QueryCorpus.findOneAndUpdate(
            { phrase: q.toLowerCase().trim() },
            { $inc: { frequency: 1 }, $set: { lastSearched: new Date(), mode: isEmergency ? 'emergency' : 'normal' }},
            { upsert: true }
        );

        res.json({
            query: q,
            emergencyMode: isEmergency,
            aiTip: aiAnalysis.survivalTip,
            location: location,
            results: finalResults.slice(0, 10),
            meta: { 
                engine: "LifeLine Hybrid v1.4",
                tokens: tokens,
                localCoverage: `${(coverage * 100).toFixed(0)}%`
            }
        });

    } catch (error) {
        console.error("Search Error:", error.message);
        res.status(500).json({ message: "Search logic failed" });
    }
};