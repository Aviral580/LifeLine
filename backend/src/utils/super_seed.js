import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
    await QueryCorpus.updateMany({}, { frequency: 0 });
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
        bulkOps.push({
            updateOne: {
                filter: { phrase: item.phrase },
                update: { 
                    $set: { 
                        frequency: item.count, 
                        category: item.mode === 'emergency' ? 'emergency' : 'general',
                        mode: item.mode 
                    }
                },
                upsert: true 
            }
        });
        for (let i = 0; i < item.count; i++) {
            logs.push({
                actionType: 'search',
                query: item.phrase,
                isEmergencyMode: item.mode === 'emergency',
                sessionId: `user_${Math.floor(Math.random() * 1000)}`, 
                timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)), 
                metadata: { source: 'simulation' }
            });
        }
    }
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