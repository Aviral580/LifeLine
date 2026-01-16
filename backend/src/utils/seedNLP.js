
import mongoose from 'mongoose';

import dotenv from 'dotenv';

import connectDB from '../config/db.js';

import QueryCorpus from '../models/QueryCorpus.js';

import ngramService from '../services/ngramService.js';



dotenv.config();



const emergencyPhrases = [

  "earthquake helpline number",

  "flood evacuation routes",

  "nearest relief camp",

  "hospital bed availability",

  "fire brigade contact",

  "tsunami warning signs",

  "safe drinking water locations",

  "electricity outage update"

];



const generalPhrases = [

  "latest news india",

  "weather forecast today",

  "stock market updates",

  "traffic alerts",

  "verified news sources"

];



const seed = async () => {

  await connectDB();

  

  console.log("🌱 Clearing old NLP data...");

  await QueryCorpus.deleteMany({});



  console.log("🌱 Seeding Emergency Phrases...");

  for (const phrase of emergencyPhrases) {

    await ngramService.learn(phrase, 'emergency');

  }



  console.log("🌱 Seeding General Phrases...");

  for (const phrase of generalPhrases) {

    await ngramService.learn(phrase, 'general');

  }



  console.log("✅ Database Seeded & NLP Model Trained!");

  process.exit();

};



seed();

