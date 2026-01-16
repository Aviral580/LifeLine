import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import API from '../../utils/api'; 
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';
const AnalyticsDashboard = () => {
  const { isEmergency } = useMode();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get('/analytics/dashboard'); 
        if(res.data.ctrStats) {
             const chartData = res.data.ctrStats.map(item => ({
                name: item._id, 
                ctr: item.clicks,
                bounce: Math.floor(Math.random() * 40) + 10 
             }));
             setData(chartData);
        }
      } catch (err) {
        console.error("Analytics Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className={cn(
      "rounded-2xl p-6 border shadow-xl transition-colors duration-500",
      isEmergency ? "bg-slate-900 border-red-800/50" : "bg-white border-slate-100"
    )}>
      <h3 className={cn("text-lg font-bold mb-4 flex justify-between", isEmergency ? "text-red-200" : "text-slate-800")}>
        <span>Live Analytics Monitor</span>
        {loading && <span className="text-xs animate-pulse opacity-50">Syncing...</span>}
      </h3>
      <div className="h-64 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
               <CartesianGrid strokeDasharray="3 3" stroke={isEmergency ? "#444" : "#eee"} />
              <XAxis dataKey="name" tick={{fill: isEmergency ? '#fca5a5' : '#64748b', fontSize: 10}} interval={0} />
              <YAxis tick={{fill: isEmergency ? '#fca5a5' : '#64748b'}} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isEmergency ? '#1f1f1f' : '#fff', 
                  borderColor: isEmergency ? '#ef4444' : '#e2e8f0',
                  color: isEmergency ? '#fff' : '#000'
                }}
              />
              <Bar dataKey="ctr" name="Clicks" fill={isEmergency ? "#ef4444" : "#3b82f6"} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm opacity-50">
            Waiting for search data...
          </div>
        )}
      </div>
    </div>
  );
};
export default AnalyticsDashboard;