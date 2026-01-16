import mongoose from 'mongoose';
const queryCorpusSchema = mongoose.Schema({
  phrase: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    enum: ['emergency', 'news', 'general'], 
    default: 'general' 
  },
  frequency: { type: Number, default: 1 }, 
  lastSearched: { type: Date, default: Date.now }
});
export default mongoose.model('QueryCorpus', queryCorpusSchema);