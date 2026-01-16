import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import QueryCorpus from '../models/QueryCorpus.js';
import natural from 'natural';
import fs from 'fs-extra';
import path from 'path';
dotenv.config();
const vastDataset = [
  "earthquake emergency kit list", "earthquake early warning system", "earthquake safety rules for school", "earthquake resistant building design", "major earthquakes in india history",
  "flood evacuation centers near me", "flood alert level today", "flood insurance coverage details", "flood rescue helpline number", "flash flood safety precautions",
  "fire extinguisher types and uses", "fire safety audit checklist", "fire department response time", "forest fire current status", "fire exit sign requirements",
  "tsunami evacuation map", "tsunami warning signs and symptoms", "tsunami history in indian ocean", "landslide prone areas map", "cyclone landfall prediction",
  "gas leak emergency number", "chemical spill response protocol", "nuclear radiation safety guide", "biological hazard alert", "disaster management act 2005",
  "ambulance service 24/7", "hospital bed availability live", "blood bank contact numbers", "cpr step by step guide", "first aid for snake bite",
  "burn injury immediate treatment", "heart attack symptoms in women", "nearest pharmacy open now", "mental health helpline", "suicide prevention lifeline",
  "oxygen cylinder suppliers", "icu ventilator availability", "pediatric emergency care", "vaccination center near me", "covid booster dose schedule",
  "latest breaking news india", "stock market opening bell", "nifty 50 live chart", "crypto price tracker bitcoin", "gold rate today per gram",
  "election results live updates", "prime minister speech today", "parliament session highlights", "supreme court latest judgment", "weather forecast for next 7 days",
  "mumbai rain update live", "delhi air quality index aqi", "bangalore traffic alerts", "tech layoffs news 2024", "ai startup funding trends",
  "cricket match live score", "ipl schedule and venues", "olympics medal tally", "football transfer news live", "tennis grand slam updates",
  "passport seva kendra appointment", "pan card application status", "aadhaar card update online", "voter id registration process", "income tax filing deadline",
  "electricity bill payment online", "water supply complaint number", "municipality office timings", "garbage collection schedule", "street light repair complaint",
  "consumer court filing process", "right to information rti act", "cyber crime reporting portal", "women safety app download", "senior citizen benefits india",
  "how to verify fake news", "trusted news sources in india", "fact check website list", "official government press release", "pib fact check twitter",
  "reliable medical websites", "how to spot deepfake videos", "secure browsing tips", "private search engines 2024", "online safety for kids"
];
const seedVastData = async () => {
  console.log("🔌 Connecting to Database...");
  await connectDB();
  console.log("🧹 Wiping old suggestions...");
  await QueryCorpus.deleteMany({});
  console.log(`🚀 Injecting ${vastDataset.length} professional queries...`);
  const entries = vastDataset.map(phrase => ({
    phrase: phrase.toLowerCase(),
    category: (phrase.includes('emergency') || phrase.includes('safety') || phrase.includes('aid')) ? 'emergency' : 'general',
    frequency: Math.floor(Math.random() * 500) + 100 
  }));
  await QueryCorpus.insertMany(entries);
  const modelPath = path.resolve('data', 'ngram_model.json');
  await fs.ensureDir(path.resolve('data'));
  await fs.writeJson(modelPath, vastDataset.map(p => p.toLowerCase()));
  console.log("✅ SUCCESS: Database and NLP Model are now VAST.");
  console.log("👉 Restart your backend to apply changes.");
  process.exit();
};
seedVastData();