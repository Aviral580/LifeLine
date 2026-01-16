import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';

// Mock Data for "CTR Monitoring" and "Bounce Rate"
const data = [
  { name: 'Source A', ctr: 4.2, bounce: 24 },
  { name: 'Source B', ctr: 8.5, bounce: 12 }, 
  { name: 'Source C', ctr: 2.1, bounce: 65 }, 
  { name: 'Source D', ctr: 6.3, bounce: 18 },
];

const AnalyticsDashboard = () => {
  const { isEmergency } = useMode();

  return (
    <div className={cn(
      "rounded-2xl p-6 border shadow-xl transition-colors duration-500",
      isEmergency ? "bg-slate-900 border-red-800/50" : "bg-white border-slate-100"
    )}>
      <h3 className={cn("text-lg font-bold mb-4", isEmergency ? "text-red-200" : "text-slate-800")}>
        Live Analytics Monitor
      </h3>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
             <CartesianGrid strokeDasharray="3 3" stroke={isEmergency ? "#444" : "#eee"} />
            <XAxis dataKey="name" tick={{fill: isEmergency ? '#fca5a5' : '#64748b'}} />
            <YAxis tick={{fill: isEmergency ? '#fca5a5' : '#64748b'}} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isEmergency ? '#1f1f1f' : '#fff', 
                borderColor: isEmergency ? '#ef4444' : '#e2e8f0',
                color: isEmergency ? '#fff' : '#000'
              }}
            />
            <Bar dataKey="ctr" name="CTR %" fill={isEmergency ? "#ef4444" : "#3b82f6"} radius={[4,4,0,0]} />
            <Bar dataKey="bounce" name="Bounce %" fill={isEmergency ? "#7f1d1d" : "#94a3b8"} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className={cn("p-4 rounded-xl", isEmergency ? "bg-red-950/50" : "bg-blue-50")}>
          <p className="text-xs opacity-70 font-semibold uppercase">Avg Time-on-Page</p>
          <p className="text-2xl font-bold">2m 45s</p>
        </div>
        <div className={cn("p-4 rounded-xl", isEmergency ? "bg-red-950/50" : "bg-blue-50")}>
          <p className="text-xs opacity-70 font-semibold uppercase">Trust Feedback</p>
          <p className="text-2xl font-bold">94%</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;