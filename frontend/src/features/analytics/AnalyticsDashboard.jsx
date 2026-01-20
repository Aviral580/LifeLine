import React, { useState, useEffect } from 'react';
import API from '../../utils/api'; 
import { 
  Activity, 
  X, 
  Maximize2, 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  Users,
  Server
} from 'lucide-react';

const AnalyticsWidget = () => {
  const [data, setData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Data Logic
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
    const interval = setInterval(fetchStats, 5000); // Live update
    return () => clearInterval(interval);
  }, []);

  if (loading) return null; // Don't show anything until loaded

  // --- FULL SCREEN DASHBOARD (The Expanded View) ---
  if (isExpanded && data) {
    const maxFreq = data.topQueries?.[0]?.frequency || 100;
    const emergencyPercent = (data.emergency / data.total) * 100;
    const normalPercent = (data.normal / data.total) * 100;

    return (
      <div className="fixed inset-0 z-[9999] bg-slate-50/95 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        {/* Close Button */}
        <button 
          onClick={() => setIsExpanded(false)}
          className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="max-w-7xl mx-auto p-8 md:p-12">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                    <Activity className="text-blue-600" /> Mission Control
                </h1>
                <p className="text-slate-500 mt-2">Live system metrics and search intelligence.</p>
            </div>

            {/* Grid Layout (Reusing your Dashboard Design) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard title="Total Traffic" value={data.total} icon={<Search className="text-white"/>} bg="bg-blue-600" />
                    <StatCard title="Emergency Mode" value={data.emergency} icon={<AlertTriangle className="text-white"/>} bg="bg-red-500" />
                    <StatCard title="Normal Mode" value={data.normal} icon={<ShieldCheck className="text-white"/>} bg="bg-teal-500" />
                    <StatCard title="Bounce Rate" value={`${data.bounceRate}%`} icon={<Users className="text-white"/>} bg="bg-slate-700" />
                    
                    {/* Traffic Bar */}
                    <div className="sm:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
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

                {/* Right Column: Top Queries */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} /> Trending Now
                    </h3>
                    <div className="space-y-5">
                        {data.topQueries.map((q, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="capitalize font-medium text-slate-700">{q.phrase}</span>
                                    <span className="text-slate-400">{q.frequency}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${q.category === 'emergency' ? 'bg-red-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${(q.frequency / maxFreq) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- MINI WIDGET (The Small Block) ---
  return (
    <div 
      className="group absolute right-0 top-10 md:top-20 z-40 p-1"
      onMouseEnter={() => {/* Optional: setIsExpanded(true) if you want instant hover */}}
    >
      <div 
        onClick={() => setIsExpanded(true)}
        className="
            cursor-pointer 
            bg-white/80 backdrop-blur-md 
            border border-white/50 shadow-xl 
            rounded-l-2xl p-4 w-48
            transform transition-all duration-300 ease-out
            translate-x-32 hover:translate-x-0 
            hover:bg-white hover:shadow-2xl
        "
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
                <div className="text-2xl font-bold text-slate-800">{data ? data.total : '-'}</div>
                <div className="text-[10px] text-slate-500">Searches Logged</div>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Maximize2 size={16} />
            </div>
        </div>
        
        <div className="mt-3 text-[10px] text-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to expand dashboard
        </div>
      </div>
    </div>
  );
};

// Helper for Full Screen Cards
const StatCard = ({ title, value, icon, bg }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
        <div>
            <p className="text-slate-500 text-sm mb-1">{title}</p>
            <h2 className="text-2xl font-bold text-slate-800">{value}</h2>
        </div>
        <div className={`p-2.5 rounded-xl shadow-md ${bg}`}>{icon}</div>
    </div>
);

export default AnalyticsWidget;