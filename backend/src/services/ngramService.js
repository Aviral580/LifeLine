import natural from 'natural';
import fs from 'fs-extra';
import path from 'path';
import QueryCorpus from '../models/QueryCorpus.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_PATH = path.resolve(__dirname, '../../data', 'ngram_model.json');
class NgramService {
  constructor() {
    this.trie = new natural.Trie();
    this.isReady = false;
    this.processedSet = new Set(); 
    this.initialize();
  }
  async initialize() {
    console.log("🔄 Initializing NLP Service...");
    try {
      const topPhrases = await QueryCorpus.find({})
        .sort({ frequency: -1 })
        .limit(10000)
        .select('phrase');
      if (topPhrases.length > 0) {
        const phrases = topPhrases.map(p => p.phrase);
        this.trie = new natural.Trie();
        this.trie.addStrings(phrases);
        phrases.forEach(p => this.processedSet.add(p));
        this.isReady = true;
        console.log(`✅ NLP Ready: Loaded top ${phrases.length} words.`);
      } else {
        console.log("⚠️ DB Empty. Waiting for searches...");
        this.isReady = true;
      }
    } catch (err) {
      console.error("❌ NLP Init Failed:", err.message);
      this.isReady = true; 
    }
  }
  addPhrase(phrase) {
    if (!phrase || typeof phrase !== 'string') return;
    const cleanPhrase = phrase.toLowerCase().trim();
    if (!this.processedSet.has(cleanPhrase)) {
        this.trie.addString(cleanPhrase);
        this.processedSet.add(cleanPhrase);
    }
  }
  async predict(prefix) {
    if (!this.isReady || !prefix) return [];
    const searchPrefix = prefix.toLowerCase().trim();
    if (!searchPrefix) return [];
    let suggestions = [];
    try {
      const rawMatches = this.trie.findPrefix(searchPrefix);
      if (rawMatches) {
        suggestions = rawMatches
          .filter(m => m !== null)
          .map(match => {
            const candidateA = searchPrefix + match;
            const candidateB = match;
            if (this.processedSet.has(candidateB)) return candidateB;
            return candidateA; 
          })
          .filter(word => word.startsWith(searchPrefix))
          .slice(0, 5);
      }
    } catch (e) {
      console.warn("Trie Lookup Error:", e.message);
    }
    if (suggestions.length < 5) {
      try {
        const dbFallback = await QueryCorpus.find({
          phrase: { $regex: `^${searchPrefix}`, $options: 'i' } 
        })
        .sort({ frequency: -1 })
        .limit(5);
        const dbPhrases = dbFallback.map(d => d.phrase);
        suggestions = [...new Set([...suggestions, ...dbPhrases])];
      } catch (err) {
        console.error("DB Lookup Error:", err.message);
      }
    }
    if (suggestions.length > 0) {
        const bestMatch = await QueryCorpus.findOne({ phrase: suggestions[0] });
        if (bestMatch && bestMatch.nextWordSuggestions && bestMatch.nextWordSuggestions.length > 0) {
            const nextWords = bestMatch.nextWordSuggestions.map(w => `${suggestions[0]} ${w}`);
            suggestions.push(...nextWords);
        }
    }
    return suggestions.slice(0, 7); 
  }
}
export default new NgramService();