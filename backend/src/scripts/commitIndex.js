import mongoose from 'mongoose';
import Page from '../models/Page.js';

mongoose.connect('mongodb://localhost:27017/errormachine');

const commitIndex = async () => {
  try {
    console.log("🧹 Checking for old indexes...");
    
    // Get all current indexes
    const indexes = await Page.collection.getIndexes();
    
    // If a text index exists, drop it
    for (const name in indexes) {
        if (name.includes('text')) {
            console.log(`🗑️  Dropping old index: ${name}`);
            await Page.collection.dropIndex(name);
        }
    }

    console.log("🛠️  Committing Weighted Search Index to 120,000 documents...");

    // Now create the new high-performance index
    await Page.collection.createIndex(
      { title: "text", content: "text" },
      { 
        weights: { title: 10, content: 1 },
        name: "LifelineSearchIndex",
        default_language: "english"
      }
    );

    console.log("✅ Success: Weighted Index built and committed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Indexing Failed:", err.message);
    process.exit(1);
  }
};

commitIndex();