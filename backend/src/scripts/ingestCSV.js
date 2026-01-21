import fs from 'fs';
import { parse } from 'csv-parse';
import mongoose from 'mongoose';
import Page from '../models/Page.js';
import natural from 'natural';

const tokenizer = new natural.WordTokenizer();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/errormachine');

const processCSV = async () => {
  const filePath = './data/corpus/train.csv'; 
  console.log(`🚀 Ingesting AG News (No-Header Mode) from: ${filePath}`);

  // FIX 1: We manually define columns because your file doesn't have headers
  const parser = fs.createReadStream(filePath).pipe(
    parse({ 
      columns: ['class_index', 'title', 'description'], 
      skip_empty_lines: true,
      trim: true 
    })
  );

  let count = 0;
  
  const categoryMap = { 
    '1': 'World', 
    '2': 'Sports', 
    '3': 'Business', 
    '4': 'Sci/Tech' 
  };

  for await (const record of parser) {
    const title = record['title'];
    const desc = record['description'];
    
    // Safety check
    if (!title || !desc) continue;

    const fullContent = `${title}. ${desc}`;
    
    // Create Fake URL
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50); // Cap length to avoid huge URLs

    const category = categoryMap[record['class_index']] || 'General';
    const url = `https://news.global/${category}/${slug}-${Math.floor(Math.random() * 1000)}`;

    const tokens = tokenizer.tokenize(fullContent.toLowerCase());
    const uniqueTokens = [...new Set(tokens)];

    const pageData = {
      url: url,
      title: title,
      content: fullContent,
      tokens: uniqueTokens,
      category: category,
      pagerank: 1.0, 
      // FIX 2: Change 'eng' to 'english' (MongoDB requires full names)
      language: 'english' 
    };

    try {
      await Page.updateOne({ url: url }, pageData, { upsert: true });
      count++;
      if (count % 1000 === 0) console.log(`📥 Ingested ${count} articles...`);
    } catch (err) {
      // If we still get a language error, we log it, but it shouldn't happen now.
      if (err.message.includes('language override')) {
          console.error(`❌ Language Error: ${err.message}`);
      }
    }
  }

  console.log(`✅ Success! Added ${count} articles to your Local Index.`);
  process.exit();
};

processCSV();