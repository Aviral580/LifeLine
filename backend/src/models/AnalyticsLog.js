import mongoose from 'mongoose';
const analyticsSchema = mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  actionType: { 
    type: String, 
    enum: ['search', 'click_result', 'bounce', 'time_on_page', 'mode_switch'], 
    required: true 
  },
  query: { type: String }, 
  targetUrl: { type: String },
  sourceTrustScore: { type: Number }, 
  timeSpentSeconds: { type: Number, default: 0 },
  isEmergencyMode: { type: Boolean, default: false },
  deviceType: { type: String, default: 'desktop' }
}, { timestamps: true });
analyticsSchema.index({ targetUrl: 1, actionType: 1 });
export default mongoose.model('AnalyticsLog', analyticsSchema);