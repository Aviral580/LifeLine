import natural from 'natural';
import fs from 'fs-extra';
import path from 'path';
import QueryCorpus from '../models/QueryCorpus.js';
const MODEL_PATH = path.resolve('data', 'ngram_model.json');
class NgramService {
  constructor() {
    this.trie = new natural.Trie();
    this.isReady = false;
    fs.ensureDirSync(path.resolve('data'));
    this.initialize();
  }
  async initialize() {
    if (fs.existsSync(MODEL_PATH)) {
      console.log(" Loading saved NLP model from disk...");
      try {
        const savedData = await fs.readJson(MODEL_PATH);
        if (Array.isArray(savedData)) {
            this.trie = new natural.Trie();
            this.trie.addStrings(savedData);
            this.isReady = true;
            console.log(" NLP Model Loaded Successfully");
        } else {
             console.log("️ Saved model format unrecognized. Retraining...");
             await this.retrainFromDB();
        }
      } catch (err) {
        console.error(" Failed to load saved model:", err.message);
        await this.retrainFromDB();
      }
    } else {
      console.log("️ No saved model found. Building from DB...");
      await this.retrainFromDB();
    }
  }
  async retrainFromDB() {
    try {
      const docs = await QueryCorpus.find({});
      const phrases = docs.map(d => d.phrase.toLowerCase());
      this.trie = new natural.Trie(); 
      this.trie.addStrings(phrases);
      this.isReady = true;
      await this.saveModel(phrases); 
      console.log(` NLP Model Retrained with ${phrases.length} phrases.`);
    } catch (error) {
      console.error("NLP Training Error:", error);
    }
  }
  async saveModel(phrases) {
    if (phrases && phrases.length > 0) {
      await fs.writeJson(MODEL_PATH, phrases);
    }
  }
  async predict(prefix) {
    if (!this.isReady || !prefix) return [];
    const searchPrefix = prefix.toLowerCase();
    const rawMatches = this.trie.findPrefix(searchPrefix);
    let suggestions = [];
    if (rawMatches) {
        suggestions = rawMatches
            .filter(m => m !== null && m !== undefined) 
            .map(match => {
                if (!match.startsWith(searchPrefix)) {
                    return searchPrefix + match;
                }
                return match;
            });
    }
    if (suggestions.length < 5) {
      const needed = 5 - suggestions.length;
      try {
          const fallbacks = await QueryCorpus.find({
            $or: [
              { phrase: { $regex: '^' + searchPrefix, $options: 'i' } },
              { category: 'emergency' }
            ]
          })
          .sort({ frequency: -1 })
          .limit(10); 
          const fallbackPhrases = fallbacks.map(f => f.phrase);
          suggestions = [...new Set([...suggestions, ...fallbackPhrases])];
      } catch (err) {
          console.error("Fallback DB Error:", err);
      }
    }
    return suggestions
      .filter(s => s !== searchPrefix) 
      .slice(0, 5); 
  }
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