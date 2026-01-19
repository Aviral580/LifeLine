import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 1. CONFIGURATION: Load .env correctly ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Look 2 levels up for .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); 

// Import DB and Models after dotenv is loaded
import connectDB from '../config/db.js';
import QueryCorpus from '../models/QueryCorpus.js';

// --- 2. THE DATASET (Object Structure) ---
const vastDataset = {
  "heart": [
    "heart attack symptoms", "heart rate monitor", "heart healthy diet", 
    "heart disease prevention", "heart surgery recovery", "heart palpitations causes",
    "heart failure warning signs", "heart bypass surgery"
  ],
  "earthquake": [
    "earthquake emergency kit", "earthquake safety rules", "earthquake prone zones map",
    "earthquake magnitude scale", "earthquake drill for schools", "earthquake resistant housing",
    "earthquake early warning app", "earthquake insurance coverage"
  ],
  "fire": [
    "fire extinguisher types", "fire evacuation plan", "fire safety audit", 
    "fire department near me", "fire alarm maintenance", "fire hazard identification",
    "fire exit signs", "fire forest alerts"
  ],
  "covid": [
    "covid vaccine registration", "covid symptoms 2026", "covid booster dose",
    "covid test centers near me", "covid travel restrictions", "covid isolation period",
    "covid variants update", "covid mask mandates"
  ],
  "blood": [
    "blood bank near me", "blood donation camp", "blood pressure chart",
    "blood sugar levels", "blood type compatibility", "blood transfusion process",
    "blood cancer symptoms", "blood oxygen level"
  ],
  "police": [
    "police helpline number", "police station location", "police verification status",
    "police report online", "police recruitment 2026", "police traffic fines",
    "police emergency response", "police cyber crime cell"
  ],
  "weather": [
    "weather forecast today", "weather radar live", "weather warning alert",
    "weather tomorrow hourly", "weather humidity levels", "weather monsoon update",
    "weather cyclone tracker", "weather heatwave precautions"
  ]
};

const seedVastData = async () => {
  try {
    console.log("🔌 Connecting to Database...");
    // Ensure URI exists
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is undefined. Check your .env file path.");
    }
    await connectDB();
    
    console.log("🧹 Wiping old suggestions...");
    await QueryCorpus.deleteMany({});
    
    // --- 3. FLATTENING THE OBJECT ---
    // Convert the Object { category: [phrases] } into a single Array of Objects
    const allEntries = [];

    Object.entries(vastDataset).forEach(([key, phrases]) => {
        phrases.forEach(phrase => {
            allEntries.push({
                phrase: phrase.toLowerCase(),
                // Smart Category Assignment:
                category: (key === 'weather') ? 'general' : 'emergency',
                frequency: Math.floor(Math.random() * 50) + 20 // Random popularity
            });
        });
    });

    console.log(`🚀 Injecting ${allEntries.length} professional queries...`);
    await QueryCorpus.insertMany(allEntries);

    // --- 4. SYNC NLP MODEL FILE ---
    // Extract just the strings for the Trie model
    const phraseList = allEntries.map(e => e.phrase);
    const modelPath = path.resolve(__dirname, '../../data', 'ngram_model.json'); // Corrected path
    
    await fs.ensureDir(path.dirname(modelPath));
    await fs.writeJson(modelPath, phraseList);

    console.log("✅ SUCCESS: Database and NLP Model are now VAST.");
    console.log("👉 Restart your backend to apply changes.");
    process.exit();
    
  } catch (error) {
    console.error("❌ Seeding Error:", error.message);
    process.exit(1);
  }
};

seedVastData();