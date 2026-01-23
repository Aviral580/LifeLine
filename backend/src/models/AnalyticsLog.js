import mongoose from 'mongoose';

const analyticsLogSchema = new mongoose.Schema({
  actionType: {
    type: String,
    // ADDED 'bounce_detected' here to stop the 500 error
    enum: ['search', 'click_result', 'view_page', 'mode_toggle', 'bounce_detected'],
    required: true
  },
  query: {
    type: String,
    lowercase: true,
    trim: true
  },
  isEmergencyMode: {
    type: Boolean,
    default: false
  },
  sessionId: {
    type: String,
    required: true,
    index: true 
  },
  // ADDED this so the DB can store the pogo-sticking time
  duration: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    source: String,     
    userAgent: String,
    clickedUrl: String  
  }
});

const AnalyticsLog = mongoose.model('AnalyticsLog', analyticsLogSchema);
export default AnalyticsLog;