
import mongoose from 'mongoose';



// This stores the raw text we train the N-gram model on

const queryCorpusSchema = mongoose.Schema({

  phrase: { type: String, required: true, unique: true },

  category: { 

    type: String, 

    enum: ['emergency', 'news', 'general'], 

    default: 'general' 

  },

  frequency: { type: Number, default: 1 }, // How often users search this

  lastSearched: { type: Date, default: Date.now }

});



export default mongoose.model('QueryCorpus', queryCorpusSchema);

