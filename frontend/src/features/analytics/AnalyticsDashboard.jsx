import React, { useState, useEffect } from 'react';
import API from '../../utils/api'; 
import { useMode } from '../../context/ModeContext'; // Integrated for visibility fix
import { cn } from '../../utils/cn'; // Integrated for dynamic classes
import { 
  Activity, 
  X, 
  Maximize2, 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  Users,
  Server,
  ThumbsUp,
  AlertOctagon,
  Trash2,
  RefreshCw,
  FileText
} from 'lucide-react';

const AnalyticsWidget = () => {
  const [data, setData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isEmergency } = useMode(); // Accessing current mode state

  // List of keywords that should always trigger red bars in trending
  const hazardKeywords = ['earthquake', 'flood', 'fire', 'storm', 'cyclone', 'tsunami', 'landslide'];

  const fetchStats = async () => {
    try {
      const response = await API.get('/analytics/dashboard');
      if (response.data.success) {
        setData(response.data.stats);
      }
    } catch (err) {
      console.error("Widget Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (window.confirm("CRITICAL: Wipe all search logs and feedback?")) {
        try {
            await API.post('/analytics/reset');
            await fetchStats();
        } catch (err) {
            console.error("Reset Failed:", err);
        }
    }
  };

  const handleDeleteBounce = async (url) => {
    try {
        await API.post('/analytics/delete-bounce', { url });
        await fetchStats();
    } catch (err) {
        console.error("Delete Failed:", err);
    }
  };

  const handleDownloadPDF = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        .print-container, .print-container * { visibility: visible; }
        .print-container { 
          position: absolute; 
          left: 0; 
          top: 0; 
          width: 100%; 
          height: auto; 
          background: white !important;
          overflow: visible !important;
        }
        .print-hidden { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  if (loading) return null; 

  if (isExpanded && data) {
    const maxFreq = data.topQueries?.[0]?.frequency || 1;
    const emergencyPercent = (data.emergency / (data.total || 1)) * 100;
    const normalPercent = (data.normal / (data.total || 1)) * 100;

    const { upvotes, reports } = data.accuracy || { upvotes: 0, reports: 0 };
    const totalFeedback = upvotes + reports;
    const accuracyRate = totalFeedback > 0 ? Math.round((upvotes / totalFeedback) * 100) : 100;

    return (
      <div className={cn(
        "fixed inset-0 z-[9999] backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 print:bg-white print:p-0 print-container",
        isEmergency ? "bg-slate-900/95" : "bg-slate-50/95"
      )}>
        {/* Close Button - Now adapts to background */}
        <button 
          onClick={() => setIsExpanded(false)}
          className={cn(
            "absolute top-6 right-6 p-2 rounded-full shadow-lg border transition-colors print:hidden",
            isEmergency 
              ? "bg-slate-800 border-slate-700 text-white hover:bg-red-600 hover:border-red-500" 
              : "bg-white border-slate-200 hover:bg-red-50 hover:text-red-600"
          )}
        >
          <X size={24} />
        </button>

        <div className="max-w-7xl mx-auto p-8 md:p-12">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className={cn("text-4xl font-bold flex items-center gap-3", isEmergency ? "text-white" : "text-slate-900")}>
                        <Activity className={isEmergency ? "text-red-500" : "text-blue-600"} /> Mission Control
                    </h1>
                    <p className={cn("mt-2", isEmergency ? "text-slate-400" : "text-slate-500")}>Live system metrics and search intelligence.</p>
                </div>
                
                <div className="flex gap-3 print:hidden">
                    <button 
                        onClick={handleDownloadPDF}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 border rounded-xl font-bold text-sm shadow-sm transition-all",
                          isEmergency 
                            ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" 
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <FileText size={16} /> PDF Report
                    </button>
                    <button 
                        onClick={handleReset}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 border rounded-xl font-bold text-sm shadow-sm transition-all",
                          isEmergency 
                            ? "bg-red-900/40 border-red-800 text-red-400 hover:bg-red-600 hover:text-white" 
                            : "bg-white border-red-100 text-red-600 hover:bg-red-600 hover:text-white"
                        )}
                    >
                        <RefreshCw size={16} /> Reset System
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <StatCard title="Total Traffic" value={data.total} icon={<Search className="text-white"/>} bg="bg-blue-600" isEmergency={isEmergency} />
                        <StatCard title="System Accuracy" value={`${accuracyRate}%`} icon={<ShieldCheck className="text-white"/>} bg="bg-emerald-500" isEmergency={isEmergency} />
                        <StatCard title="Emergency Mode" value={data.emergency} icon={<AlertTriangle className="text-white"/>} bg="bg-red-500" isEmergency={isEmergency} />
                        <StatCard title="Bounce Rate" value={`${data.bounceRate}%`} icon={<Users className="text-white"/>} bg="bg-slate-700" isEmergency={isEmergency} />
                    </div>

                    <div className={cn("p-6 rounded-2xl shadow-sm border", isEmergency ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                        <h3 className={cn("font-bold mb-4 flex items-center gap-2", isEmergency ? "text-white" : "text-slate-700")}>
                            <AlertOctagon size={18} className="text-red-500" /> At-Risk Sources (Top Bounces)
                        </h3>
                        <div className="space-y-3">
                            {data.problemSites && data.problemSites.length > 0 ? (
                                data.problemSites.map((site, i) => (
                                    <div key={i} className={cn("flex justify-between items-center p-3 rounded-xl border group/item", isEmergency ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100")}>
                                        <span className={cn("text-xs font-mono truncate max-w-[65%]", isEmergency ? "text-slate-400" : "text-slate-600")}>{site._id}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                                                {site.bounceCount} Bounces
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteBounce(site._id)}
                                                className="opacity-0 group-hover/item:opacity-100 p-1.5 text-slate-400 hover:text-red-600 transition-all print:hidden"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic">No significant pogo-sticking detected yet.</p>
                            )}
                        </div>
                    </div>

                    <div className={cn("sm:col-span-2 p-6 rounded-2xl shadow-sm border", isEmergency ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                        <h3 className={cn("font-bold mb-4 flex items-center gap-2", isEmergency ? "text-white" : "text-slate-700")}>
                            <Server size={18} /> Live Traffic Split
                        </h3>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${emergencyPercent}%` }}></div>
                            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${normalPercent}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs mt-2 text-slate-500">
                            <span>Emergency ({Math.round(emergencyPercent)}%)</span>
                            <span>Normal ({Math.round(normalPercent)}%)</span>
                        </div>
                    </div>
                </div>

                <div className={cn("p-6 rounded-2xl shadow-sm border h-fit", isEmergency ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                    <h3 className={cn("font-bold mb-6 flex items-center gap-2", isEmergency ? "text-white" : "text-slate-700")}>
                        <TrendingUp size={18} /> Trending Topics
                    </h3>
                    <div className="space-y-5">
                        {data.topQueries.map((q, i) => {
                            const isHazard = hazardKeywords.some(keyword => q.phrase.toLowerCase().includes(keyword));
                            const isEmergencyQuery = q.category === 'emergency' || isHazard;

                            return (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className={cn("capitalize font-medium", isEmergency ? "text-slate-200" : "text-slate-700")}>{q.phrase}</span>
                                        <span className="text-slate-400">{q.frequency}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${isEmergencyQuery ? 'bg-red-500' : 'bg-blue-500'}`} 
                                            style={{ width: `${(q.frequency / maxFreq) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-10 pt-6 border-t border-slate-100/10">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">User Sentiment</h4>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                <div className="bg-emerald-500 h-full" style={{ width: `${accuracyRate}%` }}></div>
                                <div className="bg-red-400 h-full" style={{ width: `${100 - accuracyRate}%` }}></div>
                            </div>
                            <span className={cn("text-sm font-bold", isEmergency ? "text-white" : "text-slate-700")}>{accuracyRate}%</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-medium text-slate-400">
                            <span className="flex items-center gap-1"><ThumbsUp size={10}/> {upvotes} Verified</span>
                            <span>{reports} Reports</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group absolute right-0 top-10 md:top-20 z-40 p-1">
      <div 
        onClick={() => setIsExpanded(true)}
        className={cn(
            "cursor-pointer backdrop-blur-md border shadow-xl rounded-l-2xl p-4 w-48 transform transition-all duration-300 ease-out translate-x-32 hover:translate-x-0 hover:shadow-2xl",
            isEmergency ? "bg-slate-900/80 border-red-900/50" : "bg-white/80 border-white/50 hover:bg-white"
        )}
      >
        <div className="flex items-center gap-3 mb-2">
            <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute -inset-1 bg-green-500 rounded-full opacity-20 animate-ping"></div>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Live</span>
        </div>
        <div className="flex items-end justify-between">
            <div>
                <div className={cn("text-2xl font-bold", isEmergency ? "text-white" : "text-slate-800")}>{data ? data.total : '-'}</div>
                <div className="text-[10px] text-slate-500">Searches Logged</div>
            </div>
            <div className={cn("p-2 rounded-lg transition-colors", isEmergency ? "bg-red-900/40 text-red-500 group-hover:bg-red-600 group-hover:text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white")}>
                <Maximize2 size={16} />
            </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bg, isEmergency }) => (
    <div className={cn("p-5 rounded-2xl shadow-sm border flex justify-between items-start", isEmergency ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>
        <div>
            <p className="text-slate-500 text-sm mb-1">{title}</p>
            <h2 className={cn("text-2xl font-bold", isEmergency ? "text-white" : "text-slate-800")}>{value}</h2>
        </div>
        <div className={`p-2.5 rounded-xl shadow-md ${bg}`}>{icon}</div>
    </div>
);

export default AnalyticsWidget;