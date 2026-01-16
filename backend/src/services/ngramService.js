import natural from 'natural';
import fs from 'fs-extra';
import path from 'path';
import QueryCorpus from '../models/QueryCorpus.js';

// Define model storage path
const MODEL_PATH = path.resolve('data', 'ngram_model.json');

class NgramService {
  constructor() {
    this.trie = new natural.Trie();
    this.isReady = false;
    
    // Ensure data directory exists
    fs.ensureDirSync(path.resolve('data'));
    
    this.initialize();
  }

  async initialize() {
    // 1. Try to load saved model from disk (Fast Start)
    if (fs.existsSync(MODEL_PATH)) {
      console.log("📂 Loading saved NLP model from disk...");
      try {
        const savedData = await fs.readJson(MODEL_PATH);
        
        if (Array.isArray(savedData)) {
            this.trie = new natural.Trie();
            this.trie.addStrings(savedData);
            this.isReady = true;
            console.log("✅ NLP Model Loaded Successfully");
        } else {
             console.log("⚠️ Saved model format unrecognized. Retraining...");
             await this.retrainFromDB();
        }
      } catch (err) {
        console.error("❌ Failed to load saved model:", err.message);
        await this.retrainFromDB();
      }
    } else {
      console.log("⚠️ No saved model found. Building from DB...");
      await this.retrainFromDB();
    }
  }

  // Train the model using data from MongoDB
  async retrainFromDB() {
    try {
      const docs = await QueryCorpus.find({});
      const phrases = docs.map(d => d.phrase.toLowerCase());
      
      this.trie = new natural.Trie(); // Reset
      this.trie.addStrings(phrases);

      this.isReady = true;
      await this.saveModel(phrases); 
      console.log(`🧠 NLP Model Retrained with ${phrases.length} phrases.`);
    } catch (error) {
      console.error("NLP Training Error:", error);
    }
  }

  async saveModel(phrases) {
    if (phrases && phrases.length > 0) {
      await fs.writeJson(MODEL_PATH, phrases);
    }
  }

  // --- THE FIXED PREDICT LOGIC ---
  async predict(prefix) {
    if (!this.isReady || !prefix) return [];
    
    const searchPrefix = prefix.toLowerCase();
    
    // 1. Get raw matches (Check for NULL to prevent crashes)
    const rawMatches = this.trie.findPrefix(searchPrefix);
    
    let suggestions = [];

    // 2. Intelligent Merge (Fixes "earthquakenull" & "earthquakeearthquake")
    if (rawMatches) {
        suggestions = rawMatches
            .filter(m => m !== null && m !== undefined) // Filter bad data
            .map(match => {
                // If the match doesn't start with the prefix, it's a suffix. Add prefix.
                // If it DOES start with the prefix, it's a full word. Keep it.
                if (!match.startsWith(searchPrefix)) {
                    return searchPrefix + match;
                }
                return match;
            });
    }

    // 3. DATABASE FALLBACK (Fixes "Showing Nothing")
    // If we have fewer than 5 results, fill the rest from the DB
    if (suggestions.length < 5) {
      const needed = 5 - suggestions.length;
      try {
          const fallbacks = await QueryCorpus.find({
            $or: [
              // Find words starting with prefix
              { phrase: { $regex: '^' + searchPrefix, $options: 'i' } },
              // OR Emergency words (if user is confused)
              { category: 'emergency' }
            ]
          })
          .sort({ frequency: -1 })
          .limit(10); // Fetch a few extra to ensure unique

          const fallbackPhrases = fallbacks.map(f => f.phrase);
          
          // Add unique fallbacks to suggestions
          suggestions = [...new Set([...suggestions, ...fallbackPhrases])];
      } catch (err) {
          console.error("Fallback DB Error:", err);
      }
    }

    // 4. Final Polish
    return suggestions
      .filter(s => s !== searchPrefix) // Remove exact duplicate of input
      .slice(0, 5); // Guarantee max 5
  }

  // Add a new search query to the learning loop
  async learn(phrase, category = 'general') {
    if (!phrase) return;
    const lowerPhrase = phrase.toLowerCase();

    this.trie.addString(lowerPhrase);
    
    await QueryCorpus.findOneAndUpdate(
      { phrase: lowerPhrase },
      { $inc: { frequency: 1 }, category, lastSearched: new Date() },
      { upsert: true, new: true }
    );
  }
}

export default new NgramService();