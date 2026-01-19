import mongoose from 'mongoose';
import dotenv from 'dotenv';
import QueryCorpus from '../models/QueryCorpus.js';
import path from 'path';

dotenv.config({ path: path.resolve('../../.env') });

const emergencyKeywords = [
  "earthquake", "flood", "fire", "tsunami", "cyclone", "gas leak", 
  "radiation", "ambulance", "hospital bed", "cpr", "first aid", "oxygen"
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Seeding Emergency Corpus...");

    const seeds = emergencyKeywords.map(word => ({
      phrase: word,
      category: 'emergency',
      frequency: 100 // High frequency ensures it triggers detection
    }));

    await QueryCorpus.deleteMany({ category: 'emergency' });
    await QueryCorpus.insertMany(seeds);

    console.log("Database Seeded Successfully!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();