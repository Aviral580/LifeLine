import natural from 'natural';
import fs from 'fs-extra';
import path from 'path';
import QueryCorpus from '../models/QueryCorpus.js';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct Path: Go up from 'services' to 'backend', then into 'data'
const MODEL_PATH = path.resolve(__dirname, '../../data', 'ngram_model.json');

class NgramService {
  constructor() {
    this.trie = new natural.Trie();
    this.isReady = false;
    // We keep a local copy of words to avoid querying DB constantly
    this.cachedPhrases = []; 
    
    // Ensure data directory exists
    fs.ensureDirSync(path.dirname(MODEL_PATH));
    
    // Don't await in constructor, call init separately
    this.initialize();
  }

  async initialize() {
    console.log("🔄 Initializing NLP Service...");

    // STRATEGY CHANGE: Always try to load from DB first (The Source of Truth)
    // This ensures that when you reload, you get the latest searches.
    try {
      const count = await QueryCorpus.countDocuments();
      
      if (count > 0) {
        console.log("📂 Database is populated. Syncing from MongoDB...");
        await this.retrainFromDB();
      } else {
        console.log("⚠️ Database empty. Attempting to load from backup file...");
        await this.loadFromFile();
      }
    } catch (err) {
      console.error("❌ DB Connection Failed during init. Using Backup File.", err);
      await this.loadFromFile();
    }
  }

  // Helper: Load from JSON file (Only used if DB fails)
  async loadFromFile() {
    if (fs.existsSync(MODEL_PATH)) {
      try {
        const savedData = await fs.readJson(MODEL_PATH);
        if (Array.isArray(savedData)) {
          this.trie = new natural.Trie();
          this.trie.addStrings(savedData);
          this.cachedPhrases = savedData; // Sync Cache
          this.isReady = true;
          console.log("✅ NLP Model Loaded from Disk Backup.");
        }
      } catch (err) {
        console.error("❌ File Load Error:", err);
      }
    }
  }

  async retrainFromDB() {
    try {
      // 1. Fetch ALL phrases from MongoDB
      const docs = await QueryCorpus.find({});
      const phrases = docs.map(d => d.phrase.toLowerCase());

      // 2. Rebuild the Trie
      this.trie = new natural.Trie();
      this.trie.addStrings(phrases);
      
      // 3. Update Cache & File
      this.cachedPhrases = phrases;
      this.isReady = true;

      // 4. Save to Disk immediately (So file is always fresh on reload)
      await this.saveModel(phrases);
      
      console.log(`✅ NLP Model Synced: ${phrases.length} phrases loaded.`);
    } catch (error) {
      console.error("❌ NLP Retraining Error:", error);
    }
  }

  async saveModel(phrases) {
    if (phrases && phrases.length > 0) {
      try {
        await fs.writeJson(MODEL_PATH, phrases);
        // console.log("💾 Model saved to disk."); // Uncomment for debugging
      } catch (err) {
        console.error("❌ Failed to save model:", err);
      }
    }
  }

  async predict(prefix) {
    if (!this.isReady || !prefix) return [];
    const searchPrefix = prefix.toLowerCase();

    // 1. Fast Trie Lookup
    const rawMatches = this.trie.findPrefix(searchPrefix);
    let suggestions = [];

    if (rawMatches) {
      suggestions = rawMatches
        .filter(m => m !== null)
        .map(match => match.startsWith(searchPrefix) ? match : searchPrefix + match);
    }

    // 2. DB Fallback (Strict)
    if (suggestions.length < 5) {
      try {
        const fallbacks = await QueryCorpus.find({
            phrase: { $regex: searchPrefix, $options: 'i' }
        })
        .sort({ frequency: -1 })
        .limit(5);

        const fallbackPhrases = fallbacks.map(f => f.phrase);
        suggestions = [...new Set([...suggestions, ...fallbackPhrases])];
      } catch (err) {
        console.error("Fallback Error:", err);
      }
    }

    return suggestions
      .filter(s => s.toLowerCase().includes(searchPrefix))
      .slice(0, 5);
  }

  async learn(phrase, category = 'general') {
    if (!phrase) return;
    const lowerPhrase = phrase.toLowerCase();
    
    // 1. Add to Trie (Memory)
    // Only add if it's not already there to prevent duplicates in RAM
    if (!this.cachedPhrases.includes(lowerPhrase)) {
        this.trie.addString(lowerPhrase);
        this.cachedPhrases.push(lowerPhrase);
        
        // 2. THE FIX: Update the file immediately!
        // This ensures if you crash/reload right now, the file has the new word.
        this.saveModel(this.cachedPhrases);
    }

    // 3. Update Database (Permanent Storage)
    await QueryCorpus.findOneAndUpdate(
      { phrase: lowerPhrase },
      { $inc: { frequency: 1 }, category, lastSearched: new Date() },
      { upsert: true, new: true }
    );
  }
}

export default new NgramService();