import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AnalyticsLog from '../models/AnalyticsLog.js';
import connectDB from '../config/db.js';
dotenv.config();
connectDB();
const seedAnalytics = async () => {
  try {
    await AnalyticsLog.deleteMany();
    await AnalyticsLog.create([
      { sessionId: 's1', actionType: 'click_result', targetUrl: 'bbc.com', isEmergencyMode: true },
      { sessionId: 's2', actionType: 'click_result', targetUrl: 'bbc.com', isEmergencyMode: true },
      { sessionId: 's3', actionType: 'bounce', targetUrl: 'fake-news.com', isEmergencyMode: false },
      { sessionId: 's4', actionType: 'click_result', targetUrl: 'ndma.gov.in', isEmergencyMode: true },
    ]);
    console.log(' Seed Data Imported');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
seedAnalytics();