import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import API from '../../utils/api'; 
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';

const SearchInterface = ({ onSearch }) => {
  const { isEmergency } = useMode();
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (skipNextFetch.current) {
        skipNextFetch.current = false; 
        return;
      }

      if (query.trim().length > 1) {
        try {
          // Calling the N-gram Service on the backend
          const { data } = await API.get(`/search/predict?q=${encodeURIComponent(query)}`);
          if (data.success) {
            setPredictions(data.suggestions);
          }
        } catch (err) {
          console.warn("Prediction service momentarily unreachable");
        }
      } else {
        setPredictions([]);
      }
    };

    const timeoutId = setTimeout(fetchPredictions, 150); // Faster debounce for smoother typing
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = () => {
    if (query.trim().length === 0) return;
    if (onSearch) onSearch(query.trim());
    setPredictions([]); 
    setIsFocused(false);
  };

  const handleSelectPrediction = (val) => {
    skipNextFetch.current = true; 
    setQuery(val);                
    setPredictions([]);           
    if (onSearch) onSearch(val);  
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-10 relative z-50">
      <div className="relative group">
        {/* Animated Glow Border */}
        <div className={cn(
          "absolute -inset-1 rounded-full blur opacity-20 transition duration-1000 group-hover:opacity-60",
          isEmergency ? "bg-gradient-to-r from-red-600 to-orange-600" : "bg-gradient-to-r from-blue-400 to-indigo-500"
        )}></div>

        {/* Search Bar Container */}
        <div className={cn(
          "relative flex items-center gap-3 p-4 rounded-full border shadow-2xl transition-all duration-500",
          isEmergency 
            ? "bg-slate-900 border-red-700/50" 
            : (isFocused ? "bg-white border-blue-500 ring-4 ring-blue-500/10" : "bg-white border-slate-200")
        )}>
          <Search className={cn("w-6 h-6 ml-2", isEmergency ? "text-red-500" : "text-slate-400")} />
          
          <input 
            type="text"
            value={query}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={isEmergency ? "Describe the emergency..." : "What are you looking for today?"}
            className={cn(
              "flex-1 bg-transparent outline-none text-lg font-medium",
              isEmergency ? "text-white placeholder-red-300/30" : "text-slate-800 placeholder-slate-400"
            )}
          />

          <button 
            onClick={handleSearch} 
            className={cn(
              "p-3 rounded-full transition-all hover:scale-110 active:scale-95 shadow-md flex items-center gap-2 px-5",
              isEmergency ? "bg-red-600 text-white hover:bg-red-500" : "bg-slate-900 text-white hover:bg-blue-700"
            )}
          >
            <span className="text-xs font-bold uppercase tracking-tighter hidden sm:inline">Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* N-Gram Prediction Dropdown */}
      {predictions.length > 0 && isFocused && (
        <div className={cn(
          "absolute w-[95%] left-[2.5%] mt-3 py-3 rounded-2xl overflow-hidden shadow-2xl z-[9999] border animate-in slide-in-from-top-2 duration-200",
          isEmergency ? "bg-slate-900 border-red-900/50 text-red-50" : "bg-white border-slate-200 text-slate-700"
        )}>
          <div className="px-6 py-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
              <Sparkles size={10} /> Suggested Queries
            </span>
          </div>
          <ul className="divide-y divide-slate-100/5">
            {predictions.map((pred, idx) => (
              <li 
                key={idx}
                onClick={() => handleSelectPrediction(pred)}
                className={cn(
                  "py-3 px-8 cursor-pointer font-semibold flex items-center gap-4 transition-all hover:pl-10",
                  isEmergency 
                    ? "hover:bg-red-950/50 hover:text-red-400" 
                    : "hover:bg-blue-50 hover:text-blue-600"
                )}
              >
                <Search size={14} className="opacity-30" />
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