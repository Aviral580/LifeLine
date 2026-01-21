import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); 
import connectDB from '../config/db.js';
import QueryCorpus from '../models/QueryCorpus.js';
const DATA_FILE = path.resolve(__dirname, '../../data/datasets/general_model.json');
const importGeneralModel = async () => {
  try {
    console.log("🔌 Connecting to Database...");
    await connectDB();
    console.log(`📖 Reading General Model from: ${DATA_FILE}`);
    if (!fs.existsSync(DATA_FILE)) {
      throw new Error(`File not found! Please place 'general_model.json' in 'backend/data/datasets/'`);
    }
    const generalData = await fs.readJson(DATA_FILE);
    if (!Array.isArray(generalData) || generalData.length === 0) {
      console.log("⚠️ JSON file is empty or invalid.");
      return;
    }
    console.log(`🚀 Preparing to inject ${generalData.length} predictive phrases...`);
    const bulkOps = generalData.map(item => ({
      updateOne: {
        filter: { phrase: item.phrase },
        update: { 
            $set: { 
                category: 'general',
                mode: 'normal',
                nextWordSuggestions: item.nextWordSuggestions 
            },
            $inc: { frequency: 50 } 
        },
        upsert: true 
      }
    }));
    const chunkSize = 1000;
    for (let i = 0; i < bulkOps.length; i += chunkSize) {
        const chunk = bulkOps.slice(i, i + chunkSize);
        process.stdout.write(`Processing chunk ${i / chunkSize + 1}...\r`);
        await QueryCorpus.bulkWrite(chunk);
    }
    console.log("\n✅ SUCCESS: General English Model imported!");
    console.log("🧠 Your Search Engine can now predict the next word for thousands of topics.");
    process.exit();
  } catch (error) {
    console.error("\n❌ Import Error:", error.message);
    process.exit(1);
  }
};
importGeneralModel();