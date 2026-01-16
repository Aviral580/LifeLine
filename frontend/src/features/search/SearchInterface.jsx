import React, { useState, useEffect } from 'react';
import { Search, Mic, ArrowRight } from 'lucide-react';
import API from '../../utils/api'; 
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';
const SearchInterface = ({ onSearch }) => {
  const { isEmergency } = useMode();
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  useEffect(() => {
    const fetchPredictions = async () => {
      if (query.length > 2) {
        try {
          const { data } = await API.get(`/search/predict?q=${query}`);
          setPredictions(data.suggestions);
        } catch (err) {
          console.error("Backend Disconnected:", err);
        }
      } else {
        setPredictions([]);
      }
    };
    const timeoutId = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);
  const handleSearch = () => {
    if (onSearch) onSearch(query);
    setPredictions([]);
  };
  return (
    <div className="w-full max-w-2xl mx-auto mb-10 relative z-50">
      <div className="relative group">
        <div className={cn(
          "absolute -inset-1 rounded-full blur opacity-25 transition duration-1000 group-hover:opacity-75",
          isEmergency ? "bg-gradient-to-r from-red-600 to-orange-600" : "bg-gradient-to-r from-blue-400 to-indigo-500"
        )}></div>
        <div className={cn(
          "relative flex items-center gap-3 p-4 rounded-full border shadow-2xl transition-colors duration-500",
          isEmergency ? "bg-slate-900 border-red-700" : "bg-white border-white"
        )}>
          <Search className={cn("w-6 h-6", isEmergency ? "text-red-500" : "text-slate-400")} />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={isEmergency ? "Emergency: Enter keywords..." : "Search trusted sources..."}
            className={cn(
              "flex-1 bg-transparent outline-none text-lg font-medium",
              isEmergency ? "text-white placeholder-red-300/50" : "text-slate-800 placeholder-slate-400"
            )}
          />
          <button onClick={handleSearch} className={cn(
            "p-3 rounded-full transition-transform hover:scale-105 active:scale-95",
            isEmergency ? "bg-red-600 text-white" : "bg-slate-900 text-white"
          )}>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      {}
      {predictions.length > 0 && (
        <div className={cn(
          "mt-2 mx-4 p-4 rounded-2xl border backdrop-blur-xl absolute w-full max-w-2xl shadow-xl",
          isEmergency ? "bg-slate-900/95 border-red-800 text-red-100" : "bg-white/95 border-slate-100 text-slate-600"
        )}>
           <p className="text-[10px] font-bold opacity-50 mb-2 uppercase tracking-widest">
             AI Suggestions
           </p>
           <ul>
             {predictions.map((pred, idx) => (
               <li 
                 key={idx}
                 onClick={() => { setQuery(pred); setPredictions([]); }}
                 className="py-2 px-2 hover:bg-black/5 rounded cursor-pointer border-b border-transparent hover:border-black/5 transition-all"
               >
                 {pred}
               </li>
             ))}
           </ul>
        </div>
      )}
    </div>
  );
};
export default SearchInterface;