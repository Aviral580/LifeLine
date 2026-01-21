import axios from 'axios';
import * as cheerio from 'cheerio';

export const liveScrape = async (query) => {
    try {
        console.log(`🌐 Scraper: Fetching live data for "${query}"...`);
        
        // We use DuckDuckGo's HTML version (no JS needed, very fast)
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(data);
        const scrapedResults = [];

        // DuckDuckGo HTML result selector
        $('.result').each((i, el) => {
            if (i < 10) { // Limit to top 10 external results
                const title = $(el).find('.result__title').text().trim();
                const url = $(el).find('.result__url').text().trim();
                const snippet = $(el).find('.result__snippet').text().trim();

                if (title && snippet) {
                    scrapedResults.push({
                        title,
                        url: `https://${url}`,
                        content: snippet,
                        category: 'Scraped',
                        pagerank: 0.5 // External results get lower initial authority
                    });
                }
            }
        });

        return scrapedResults;
    } catch (error) {
        console.error("❌ Scraper Error:", error.message);
        return [];
    }
};