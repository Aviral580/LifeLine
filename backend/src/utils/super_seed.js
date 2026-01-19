import mongoose from 'mongoose';
import dotenv from 'dotenv';
import QueryCorpus from '../models/QueryCorpus.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Standard way to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This moves up THREE levels: utils -> src -> backend -> root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const emergencyKeywords = [
  "earthquake", "flood", "fire", "tsunami", "cyclone", "gas leak", 
  "radiation", "ambulance", "hospital bed", "cpr", "first aid", "oxygen"
];

const seedDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    
    const seeds = emergencyKeywords.map(word => ({
      phrase: word,
      category: 'emergency',
      frequency: 100
    }));

    // Clean and insert
    await QueryCorpus.deleteMany({ category: 'emergency' });
    await QueryCorpus.insertMany(seeds);

    console.log("✅ Database Seeded Successfully with Emergency Keywords!");
    process.exit();
  } catch (err) {
    console.error("❌ Seed Error:", err.message);
    process.exit(1);
  }
};

seedDB();