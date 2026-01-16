
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

      const savedData = await fs.readJson(MODEL_PATH);

      this.trie = natural.Trie.restore(savedData);

      this.isReady = true;

    } else {

      console.log("⚠️ No saved model found. Building from DB...");

      await this.retrainFromDB();

    }

  }



  // Train the model using data from MongoDB

  async retrainFromDB() {

    try {

      const phrases = await QueryCorpus.find({});

      this.trie = new natural.Trie(); // Reset

      

      phrases.forEach(doc => {

        // Add phrase to Trie (lowercase for consistency)

        this.trie.addString(doc.phrase.toLowerCase());

      });



      this.isReady = true;

      await this.saveModel();

      console.log(`🧠 NLP Model Retrained with ${phrases.length} phrases.`);

    } catch (error) {

      console.error("NLP Training Error:", error);

    }

  }



  // Save the current state to disk

  async saveModel() {

    if (this.trie) {

      await fs.writeJson(MODEL_PATH, JSON.stringify(this.trie));

    }

  }



  // The main function used by the Frontend

  predict(prefix) {

    if (!this.isReady || !prefix) return [];

    

    // Get completions

    const completions = this.trie.findPrefix(prefix.toLowerCase());

    

    // Format and rank them (simple alpha sort for now, can be frequency based later)

    return completions

      .slice(0, 5) // Limit to top 5

      .map(suffix => prefix + suffix.substring(prefix.length)); // Reconstruct full word

  }



  // Add a new search query to the learning loop

  async learn(phrase, category = 'general') {

    if (!phrase) return;



    // 1. Add to in-memory Trie immediately

    this.trie.addString(phrase.toLowerCase());

    

    // 2. Persist to DB (for long-term memory)

    await QueryCorpus.findOneAndUpdate(

      { phrase: phrase.toLowerCase() },

      { $inc: { frequency: 1 }, category, lastSearched: new Date() },

      { upsert: true, new: true }

    );



    // 3. periodically save to disk (debounced in real app)

    await this.saveModel();

  }

}



export default new NgramService();

