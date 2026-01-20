import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); 

import connectDB from '../config/db.js';
import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from '../models/QueryCorpus.js';

const seedMasterSync = async () => {
  try {
    console.log("🔌 Connecting to Database...");
    await connectDB();
    
    console.log("🧹 Clearing old history...");
    await AnalyticsLog.deleteMany({});
    
    // Optional: Reset all frequencies to 0 so we see fresh trends
    await QueryCorpus.updateMany({}, { frequency: 0 });

    // --- SCENARIO: A "Health & Disaster" Spike ---
    // We will generate heavy traffic for these specific terms
    const scenarios = [
        { phrase: "heart attack symptoms", mode: "emergency", count: 85 },
        { phrase: "earthquake early warning", mode: "emergency", count: 70 },
        { phrase: "stock market live", mode: "normal", count: 45 },
        { phrase: "covid vaccine centers", mode: "emergency", count: 60 },
        { phrase: "weather forecast today", mode: "normal", count: 30 },
        { phrase: "first aid for burns", mode: "emergency", count: 25 },
        { phrase: "latest tech news", mode: "normal", count: 15 }
    ];

    const logs = [];
    const bulkOps = [];

    console.log("🏭 Generating consistent traffic data...");

    for (const item of scenarios) {
        // 1. Update QueryCorpus (The Trending List)
        // We set the frequency directly to match the log count
        bulkOps.push({
            updateOne: {
                filter: { phrase: item.phrase },
                update: { 
                    $set: { 
                        frequency: item.count, 
                        category: item.mode === 'emergency' ? 'emergency' : 'general',
                        mode: item.mode // Ensure mode matches
                    }
                },
                upsert: true // Create if it doesn't exist
            }
        });

        // 2. Generate Individual Logs (The Charts/Graphs)
        for (let i = 0; i < item.count; i++) {
            logs.push({
                actionType: 'search',
                query: item.phrase,
                isEmergencyMode: item.mode === 'emergency',
                sessionId: `user_${Math.floor(Math.random() * 1000)}`, // Random users
                timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)), // Last 24 hours
                metadata: { source: 'simulation' }
            });
        }
    }

    // Execute Bulk Updates
    if (bulkOps.length > 0) {
        await QueryCorpus.bulkWrite(bulkOps);
    }
    
    if (logs.length > 0) {
        await AnalyticsLog.insertMany(logs);
    }

    console.log(`✅ SUCCESS: Synced ${logs.length} logs with Trending Scores.`);
    console.log("📊 Your Dashboard and Trending List are now perfectly matched.");
    process.exit();
    
  } catch (error) {
    console.error("❌ Seeding Error:", error.message);
    process.exit(1);
  }
};

seedMasterSync();