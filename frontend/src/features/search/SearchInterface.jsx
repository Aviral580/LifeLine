import React, { useState, useEffect, useRef } from "react";
import { Search, Mic, ArrowRight } from "lucide-react";
import API from "../../utils/api";
import { useMode } from "../../context/ModeContext";
import { cn } from "../../utils/cn";

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

      if (!query) return setPredictions([]);

      try {
        const { data } = await API.get(`/query/predict?q=${query}`);
        setPredictions(data.suggestions || []);
      } catch {
        setPredictions([]);
      }
    };

    const t = setTimeout(fetchPredictions, 200);
    return () => clearTimeout(t);
  }, [query]);

  const startVoiceSearch = () => {
    const Speech =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return alert("Voice search not supported");

    const recognition = new Speech();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setQuery(text);
      onSearch(text);
    };
  };

  const submit = () => {
    if (!query) return;
    onSearch(query);
    setPredictions([]);
  };

  const selectPrediction = (val) => {
    skipNextFetch.current = true;
    setQuery(val);
    onSearch(val);
    setPredictions([]);
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className={cn(
        "flex items-center p-4 rounded-full border",
        isEmergency ? "bg-slate-900 text-white" : "bg-white text-black"
      )}>
        <Search className="w-5 h-5 text-slate-400" />
        <input
          className="flex-1 mx-3 outline-none bg-transparent"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Search trusted sources..."
        />
        <button onClick={submit}><ArrowRight /></button>
        <button onClick={startVoiceSearch}><Mic /></button>
      </div>

      {predictions.length > 0 && (
        <ul className={cn(
          "absolute w-full rounded mt-2 shadow",
          isEmergency ? "bg-slate-800 text-white" : "bg-white text-black"
        )}>
          {predictions.map((p, i) => (
            <li
              key={i}
              onClick={() => selectPrediction(p)}
              className={cn(
                "px-4 py-2 cursor-pointer hover:bg-slate-100",
                isEmergency ? "hover:bg-slate-700" : "hover:bg-slate-100"
              )}
            >
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchInterface;
