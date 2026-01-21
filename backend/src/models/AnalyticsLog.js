import mongoose from 'mongoose';
const analyticsLogSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: ['search', 'click_result', 'view_page', 'mode_toggle'],
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