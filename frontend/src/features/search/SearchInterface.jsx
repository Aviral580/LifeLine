import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, ArrowRight } from 'lucide-react';
import API from '../../utils/api'; 
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';
const SearchInterface = ({ onSearch }) => {
  const { isEmergency } = useMode();
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const skipNextFetch = useRef(false);
  useEffect(() => {
    const fetchPredictions = async () => {
      if (skipNextFetch.current) {
        skipNextFetch.current = false; 
        return;
      }
      if (query.length > 0) {
        try {
          const { data } = await API.get(`/search/predict?q=${query}&t=${Date.now()}`);
          setPredictions(data.suggestions);
        } catch (err) {
          console.error("Connection Failed:", err);
        }
      } else {
        setPredictions([]);
      }
    };
    const timeoutId = setTimeout(fetchPredictions, 200); 
    return () => clearTimeout(timeoutId);
  }, [query]);
  const handleSearch = () => {
    if (onSearch) onSearch(query);
    setPredictions([]); 
  };
  const handleSelectPrediction = (val) => {
    skipNextFetch.current = true; 
    setQuery(val);                
    setPredictions([]);           
    if (onSearch) onSearch(val);  
  };
  return (
    <div className="w-full max-w-2xl mx-auto mb-10 relative z-50">
      {}
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
          "absolute w-full mt-2 py-2 rounded-xl overflow-hidden shadow-2xl z-[9999] border",
          isEmergency ? "bg-slate-900 border-red-900/50" : "bg-white border-gray-100"
        )}>
           <ul className="divide-y divide-gray-100/10">
             {predictions.map((pred, idx) => (
               <li 
                 key={idx}
                 onClick={() => handleSelectPrediction(pred)}
                 className={cn(
                   "py-3 px-6 cursor-pointer font-medium flex items-center gap-3 transition-colors",
                   isEmergency 
                    ? "text-red-100 hover:bg-red-900/30" 
                    : "text-slate-700 hover:bg-blue-50"
                 )}
               >
                 <Search className={cn("w-4 h-4", isEmergency ? "text-red-400" : "text-slate-400")} />
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