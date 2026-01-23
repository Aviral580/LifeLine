import mongoose from 'mongoose';

const PageSchema = mongoose.Schema({
  url: { type: String, required: true, unique: true },
  title: { type: String }, // Explicitly added title for cleaner results
  content: { type: String, required: true },
  
  // Cleaned words for the BM25 math
  tokens: [String], 
  
  // Authority score (starts at 1.0, increases with backlinks/feedback)
  pagerank: { type: Number, default: 1.0 },
  
  // --- NEW: Self-Learning Fields ---
  // Tracks popularity (popularity = trust signal)
  clicks: { type: Number, default: 0 },
  
  // Tracks if this source has been flagged recently
  lastReportedAt: { type: Date },

  category: { type: String, default: 'General' },
  language: { type: String, default: 'english' }
}, { timestamps: true });

// Crucial: This allows the engine to find keywords inside the content
PageSchema.index({ content: 'text', title: 'text' });
PageSchema.index({ url: 1 }); // Faster lookups for feedback matching

export default mongoose.model('Page', PageSchema);