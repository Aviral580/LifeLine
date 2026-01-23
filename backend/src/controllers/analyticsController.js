import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from '../models/QueryCorpus.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalSearches = await AnalyticsLog.countDocuments({ actionType: 'search' });
    const emergencyUsage = await AnalyticsLog.countDocuments({ isEmergencyMode: true });
    const normalUsage = totalSearches - emergencyUsage;
    
    const topQueries = await QueryCorpus.find({})
      .sort({ frequency: -1 })
      .limit(5)
      .select('phrase frequency category');

    // Calculate Bounce Rate (Silent calculation, no console spam)
    const bounceData = await AnalyticsLog.aggregate([
        { $group: { _id: "$sessionId", count: { $sum: 1 } } },
        { $match: { count: 1 } },
        { $count: "bounces" }
    ]);
    
    const bounces = bounceData.length > 0 ? bounceData[0].bounces : 0;
    const totalSessions = await AnalyticsLog.distinct('sessionId');
    const sessionCount = totalSessions.length;
    const bounceRate = sessionCount > 0 
        ? Math.round((bounces / sessionCount) * 100) 
        : 0;

    // REMOVED: The annoying console.log line

    res.json({
      success: true,
      stats: {
        total: totalSearches,
        emergency: emergencyUsage,
        normal: normalUsage,
        bounceRate: bounceRate,
        topQueries: topQueries
      }
    });
  } catch (error) {
    console.error("Analytics Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};