import mongoose from 'mongoose';

const feedbackSchema = mongoose.Schema({
  targetUrl: { type: String, required: true },
  feedbackType: { 
    type: String, 
    enum: ['upvote', 'downvote', 'fake_news_report'], 
    required: true 
  },
  userComment: { type: String },
  trustScoreImpact: { type: Number, default: 0 }, // Calculated weight
  verifiedUser: { type: Boolean, default: false } // Placeholder for Dhairya's Auth
}, { timestamps: true });

export default mongoose.model('Feedback', feedbackSchema);
