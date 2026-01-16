import mongoose from 'mongoose';

const analyticsSchema = mongoose.Schema({
  sessionId: { type: String, required: true },
  actionType: { 
    type: String, 
    enum: ['search', 'click_result', 'bounce', 'time_on_page'], 
    required: true 
  },
  targetUrl: { type: String },
  sourceId: { type: String }, // To track specific verified sources
  duration: { type: Number }, // For time-on-page metrics
  isEmergencyMode: { type: Boolean, default: false },
  metadata: { type: Object } // Flexible field for extra data
}, { timestamps: true });

// Index for faster aggregation of CTR
analyticsSchema.index({ targetUrl: 1, actionType: 1 });

export default mongoose.model('AnalyticsLog', analyticsSchema);
