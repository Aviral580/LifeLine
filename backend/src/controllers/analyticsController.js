import AnalyticsLog from '../models/AnalyticsLog.js';

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Calculate Top 5 Most Clicked Sources (CTR)
    const ctrStats = await AnalyticsLog.aggregate([
      { $match: { actionType: 'click_result' } },
      { $group: { _id: '$targetUrl', clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 5 }
    ]);

    // 2. Count Total Searches
    const totalSearches = await AnalyticsLog.countDocuments({ actionType: 'search' });
    
    // 3. Count Emergency Mode Usage
    const emergencyUsage = await AnalyticsLog.countDocuments({ isEmergencyMode: true });

    res.json({
      ctrStats,
      totalSearches,
      emergencyUsage
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
