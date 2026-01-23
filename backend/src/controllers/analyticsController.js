import AnalyticsLog from '../models/AnalyticsLog.js';
import QueryCorpus from '../models/QueryCorpus.js';
import Feedback from '../models/Feedback.js';

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Precise Traffic Counts - Explicitly checking actionType 'search' for accuracy
    const totalSearches = await AnalyticsLog.countDocuments({ actionType: 'search' });
    const emergencyUsage = await AnalyticsLog.countDocuments({ actionType: 'search', isEmergencyMode: true });
    
    const totalClicks = await AnalyticsLog.countDocuments({ actionType: 'click_result' });
    const totalBounces = await AnalyticsLog.countDocuments({ actionType: 'bounce_detected' });
    
    const bounceRate = totalClicks > 0 
        ? Math.round((totalBounces / totalClicks) * 100) 
        : 0;

    // --- SMART QUERY GROUPING (Hazard Clustering) ---
    // Instead of exact matching, we group by the primary keyword (first word)
    const topQueriesGrouped = await QueryCorpus.aggregate([
        {
            $group: {
                _id: { $arrayElemAt: [{ $split: ["$phrase", " "] }, 0] }, // Extract first word
                totalFreq: { $sum: "$frequency" },
                category: { $first: "$category" }
            }
        },
        { $sort: { totalFreq: -1 } },
        { $limit: 5 }
    ]);

    const feedbackStats = await Feedback.aggregate([
      { $group: { _id: null, 
          upvotes: { $sum: { $cond: [{ $eq: ["$feedbackType", "upvote"] }, 1, 0] } },
          reports: { $sum: { $cond: [{ $eq: ["$feedbackType", "fake_news_report"] }, 1, 0] } } 
      }}
    ]);

    const problemSites = await AnalyticsLog.aggregate([
      { $match: { actionType: 'bounce_detected' } },
      { $group: { _id: "$metadata.clickedUrl", bounceCount: { $sum: 1 } } },
      { $sort: { bounceCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalSearches,
        emergency: emergencyUsage,
        normal: totalSearches - emergencyUsage,
        bounceRate: bounceRate, 
        totalBounces: totalBounces,
        totalClicks: totalClicks,
        // Map grouped results back to your expected frontend structure
        topQueries: topQueriesGrouped.map(q => ({
            phrase: q._id,
            frequency: q.totalFreq,
            category: q.category
        })),
        accuracy: feedbackStats[0] || { upvotes: 0, reports: 0 },
        problemSites: problemSites
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SYSTEM CONTROL ACTIONS ---

export const resetAnalytics = async (req, res) => {
    try {
        await Promise.all([
            AnalyticsLog.deleteMany({}),
            QueryCorpus.updateMany({}, { $set: { frequency: 0 } }),
            Feedback.deleteMany({})
        ]);
        
        console.log("♻️ System Reset Triggered and Completed");
        res.json({ success: true, message: "System Reset Successful" });
    } catch (error) {
        console.error("Reset Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSpecificBounce = async (req, res) => {
    try {
        const { url } = req.body;
        
        const deleted = await AnalyticsLog.findOneAndDelete(
            { 
                actionType: 'bounce_detected', 
                "metadata.clickedUrl": url 
            }, 
            { sort: { timestamp: -1 } }
        );
        
        if (deleted) {
            console.log(`🗑️ Removed bounce for: ${url}`);
            res.json({ success: true, message: "Bounce removed" });
        } else {
            console.log(`⚠️ No bounce found to delete for: ${url}`);
            res.json({ success: false, message: "No matching bounce found" });
        }
    } catch (error) {
        console.error("Delete Error:", error.message);
        res.status(500).json({ success: false });
    }
};