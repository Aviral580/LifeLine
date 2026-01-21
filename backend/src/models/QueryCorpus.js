import mongoose from 'mongoose';

const queryCorpusSchema = new mongoose.Schema({
  phrase: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  frequency: { 
    type: Number, 
    default: 1 
  },
  category: { 
    type: String, 
    default: 'general' 
  },
  mode: {
    type: String,
    enum: ['emergency', 'normal'],
    default: 'normal'
  },
  lastSearched: { 
    type: Date, 
    default: Date.now 
  }
});

const QueryCorpus = mongoose.model('QueryCorpus', queryCorpusSchema);
export default QueryCorpus;