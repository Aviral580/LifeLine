import fs from 'fs-extra';
import path from 'path';
import QueryCorpus from '../models/QueryCorpus.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_PATH = path.resolve(__dirname, '../../data', 'ngram_model.json');

class NgramService {
  constructor() {
    // The "Brain": Maps a word to a list of possible next words with their scores
    // Structure: { "python": { "is": 5, "code": 2 }, "is": { "a": 10, "the": 4 } }
    this.bigramMap = new Map();
    this.isReady = false;
    this.initialize();
  }

  async initialize() {
    console.log("🔄 N-Gram Engine: Building Probability Model...");
    
    try {
      let rawData = [];

      // 1. Load Static Model (The AG News / Sherlock stream)
      if (fs.existsSync(MODEL_PATH)) {
        const fileData = await fs.readJson(MODEL_PATH);
        if (Array.isArray(fileData)) {
            // Flatten logic in case it's an array of objects or strings
            rawData = fileData.map(item => typeof item === 'string' ? item : item.phrase);
        }
      }

      // 2. Load Dynamic History from DB to learn from user searches
      const dbPhrases = await QueryCorpus.find({}).limit(5000).select('phrase');
      if (dbPhrases.length > 0) {
          // Break DB phrases into individual words to add to the model
          dbPhrases.forEach(p => {
              if (p.phrase) rawData.push(...p.phrase.split(' '));
          });
      }

      // 3. Train the Model (Build the Markov Chain)
      this.trainModel(rawData);
      
      this.isReady = true;
      console.log(`✅ N-Gram Engine: Ready. Learned relationships between ${this.bigramMap.size} unique words.`);

    } catch (err) {
      console.error("❌ N-Gram Model Error:", err.message);
      this.isReady = true; 
    }
  }

  trainModel(wordsArray) {
    // Normalize and clean
    const cleanWords = wordsArray
        .filter(w => w && typeof w === 'string')
        .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));

    for (let i = 0; i < cleanWords.length - 1; i++) {
        const current = cleanWords[i];
        const next = cleanWords[i + 1];

        if (!current || !next) continue;

        if (!this.bigramMap.has(current)) {
            this.bigramMap.set(current, new Map());
        }

        const nextWords = this.bigramMap.get(current);
        // Increment frequency count for this sequence
        nextWords.set(next, (nextWords.get(next) || 0) + 1);
    }
  }

  predict(fullInput) {
    if (!this.isReady || !fullInput) return [];

    const cleanInput = fullInput.toLowerCase().trimEnd(); // Remove trailing space for logic, keep for context check
    const endsWithSpace = fullInput.endsWith(' ');
    
    // Split input into words
    const words = cleanInput.split(/\s+/);
    
    let candidates = [];
    let context = "";

    if (endsWithSpace) {
        // CASE 1: "python is " -> User wants the NEXT word after "is"
        const lastWord = words[words.length - 1];
        context = fullInput; // Context is the whole string including space
        candidates = this.getNextWords(lastWord);
    } else {
        // CASE 2: "python is go" -> User is typing the word after "is"
        const lastCompletedWord = words.length > 1 ? words[words.length - 2] : null;
        const currentFragment = words[words.length - 1];
        
        // Context is everything BEFORE the fragment
        context = fullInput.substring(0, fullInput.lastIndexOf(currentFragment));

        if (lastCompletedWord) {
            // Find words following "is" that start with "go"
            const potentialNext = this.getNextWords(lastCompletedWord);
            candidates = potentialNext.filter(w => w.startsWith(currentFragment));
        } else {
            // Very start of sentence: simple prefix lookup (fallback)
            // Ideally we'd have a 'start' node, but for now we search keys
            // This part can be slow on huge maps, usually we skip or use a separate Trie for starters
            candidates = []; 
        }
    }

    // Transform candidates into full sentences
    // limit to 5 top suggestions
    return candidates.slice(0, 5).map(word => {
        // If we are completing a fragment, remove the fragment from context to avoid double typing
        return context + word;
    });
  }

  getNextWords(word) {
    if (!this.bigramMap.has(word)) return [];
    
    const followerMap = this.bigramMap.get(word);
    
    // Sort by frequency (highest probability first)
    return Array.from(followerMap.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .map(entry => entry[0]);     // Return just the words
  }
}

export default new NgramService();