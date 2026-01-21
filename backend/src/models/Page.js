import mongoose from 'mongoose';

const PageSchema = mongoose.Schema({
  url: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  // Cleaned words for the BM25 math
  tokens: [String], 
  // Authority score (starts at 1.0, increases with backlinks/feedback)
  pagerank: { type: Number, default: 1.0 },
  language: { type: String, default: 'eng' }
}, { timestamps: true });

// Crucial: This allows the engine to find keywords inside the content
PageSchema.index({ content: 'text' });

export default mongoose.model('Page', PageSchema);