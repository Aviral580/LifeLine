import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Sparkles, Mic, MicOff } from 'lucide-react';
import API from '../../utils/api'; 
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';

const SearchInterface = ({ onSearch }) => {
  const { isEmergency } = useMode();
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isListening, setIsListening] = useState(false); // New state for voice
  const containerRef = useRef(null);

  // --- VOICE SEARCH LOGIC ---
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      // Directly trigger the search logic passed from Home.jsx
      if (onSearch) onSearch(transcript); 
      setIsListening(false);
    };

    recognition.onerror = (err) => {
      console.error("Speech Recognition Error:", err);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // 1. N-Gram Fetcher (Unchanged)
  useEffect(() => {
    const fetchPredictions = async () => {
      if (query.trim().length < 2) {
        setPredictions([]);
        return;
      }
      try {
        const { data } = await API.get(`/search/predict?q=${encodeURIComponent(query)}`);
        if (data && data.suggestions) {
           setPredictions(data.suggestions);
           setShowPredictions(true);
        }
      } catch (err) {
        console.warn("Prediction failed:", err);
      }
    };
    const timeoutId = setTimeout(fetchPredictions, 150);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // 2. Handle "Click Outside" (Unchanged)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    if (onSearch) onSearch(query.trim());
    setShowPredictions(false);
  };

  const handleSelectPrediction = (val) => {
    setQuery(val);                
    setPredictions([]);           
    setShowPredictions(false);
    if (onSearch) onSearch(val);  
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto mb-10 relative z-50">
      <div className="relative group">
        <div className={cn(
          "absolute -inset-1 rounded-full blur opacity-25 transition duration-1000 group-hover:opacity-75",
          isEmergency ? "bg-gradient-to-r from-red-600 to-orange-600" : "bg-gradient-to-r from-blue-400 to-indigo-500"
        )}></div>

        <div className={cn(
          "relative flex items-center gap-3 p-4 rounded-full border shadow-2xl transition-all duration-300",
          isEmergency ? "bg-slate-900 border-red-700/50" : "bg-white border-slate-200"
        )}>
          <Search className={cn("w-6 h-6 ml-2", isEmergency ? "text-red-500" : "text-slate-400")} />
          
          <input 
            type="text"
            value={query}
            onFocus={() => setShowPredictions(true)}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={isEmergency ? "Describe the emergency..." : "What are you looking for?"}
            className={cn(
              "flex-1 bg-transparent outline-none text-lg font-medium",
              isEmergency ? "text-white placeholder-red-300/30" : "text-slate-800 placeholder-slate-400"
            )}
          />

          {/* VOICE BUTTON INTEGRATION */}
          <button 
            type="button"
            onClick={handleVoiceSearch}
            className={cn(
              "p-2 rounded-full transition-all duration-300",
              isListening 
                ? "text-red-500 animate-pulse bg-red-500/10" 
                : "text-slate-400 hover:text-blue-500"
            )}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button 
            onClick={handleSearch} 
            className={cn(
              "p-3 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-md",
              isEmergency ? "bg-red-600 text-white" : "bg-slate-900 text-white"
            )}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showPredictions && predictions.length > 0 && (
        <div className={cn(
          "absolute w-[95%] left-[2.5%] mt-2 py-2 rounded-2xl overflow-hidden shadow-xl z-[9999] border animate-in slide-in-from-top-2",
          isEmergency ? "bg-slate-900 border-red-900/50" : "bg-white border-slate-100"
        )}>
          <div className="px-5 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
              <Sparkles size={10} /> Suggested
            </span>
          </div>
          <ul className="divide-y divide-slate-100/10">
            {predictions.map((pred, idx) => (
              <li 
                key={idx}
                onClick={() => handleSelectPrediction(pred)}
                className={cn(
                  "py-3 px-6 cursor-pointer font-medium transition-colors hover:pl-8 flex items-center gap-3",
                  isEmergency 
                    ? "text-red-50 hover:bg-red-900/40 hover:text-white" 
                    : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                )}
              >
                <Search size={14} className="opacity-20" />
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