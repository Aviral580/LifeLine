import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import SearchInterface from '../features/search/SearchInterface';
import AnalyticsDashboard from '../features/analytics/AnalyticsDashboard';
import ResultCard from '../features/search/ResultCard';
import { useMode } from '../context/ModeContext';
import { cn } from '../utils/cn';
import API from '../utils/api'; 
import { Loader2, Info } from 'lucide-react';

const Home = () => {
  const { isEmergency } = useMode();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiTip, setAiTip] = useState("");
  const [meta, setMeta] = useState(null);

  const handleSearch = async (query) => {
    if (!query) return;
    
    setLoading(true);
    const sessionId = 'session-' + Math.random().toString(36).substr(2, 9);

    try {
      const searchRes = await API.get(`/search/execute?q=${encodeURIComponent(query)}`);
      
      if (searchRes.data) {
        setResults(searchRes.data.results || []);
        setAiTip(searchRes.data.aiTip || "");
        setMeta(searchRes.data.meta || null);
      }

      API.post('/search/log', {
        query: query,
        sessionId: sessionId,
        isEmergencyMode: isEmergency
      }).catch(err => console.error("Logging failed", err));

    } catch (error) {
      console.error("Search Execution Error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500", 
      isEmergency ? "bg-[#0a0a0a]" : "bg-slate-50"
    )}>
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            
            <div className="text-center mb-12">
              <h1 className={cn(
                "text-4xl md:text-6xl font-black mb-4 tracking-tighter transition-all", 
                isEmergency ? "text-white" : "text-slate-900"
              )}>
                {isEmergency ? "CRITICAL INFORMATION" : "LifeLine"}
              </h1>
              <p className={cn("text-lg italic font-medium", isEmergency ? "text-red-200" : "text-slate-500")}>
                {isEmergency 
                  ? "Verified safety protocols and real-time emergency resources." 
                  : "The search engine that actually graduated from journalism school."}
              </p>
            </div>

            <SearchInterface onSearch={handleSearch} />

            {aiTip && (
              <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-4">
                <div className="p-2 bg-red-600 rounded-lg text-white">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="text-red-500 font-bold text-sm uppercase tracking-widest">AI Survival Tip</h4>
                  <p className={cn("text-lg font-medium", isEmergency ? "text-red-50" : "text-slate-800")}>{aiTip}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center py-20 text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
                  <p className="font-medium">Verifying sources and ranking data...</p>
                </div>
              ) : results.length > 0 ? (
                results.map((res, index) => (
                  <ResultCard 
                    key={index}
                    title={res.title}
                    source={res.source}
                    trustScore={Math.round(res.score)}
                    summary={res.summary}
                    url={res.url}
                  />
                ))
              ) : (
                <div className="py-20 text-center opacity-40">
                  <p className="text-xl italic">
                    {meta ? "No results met our editorial standards." : "LifeLine: Trust-First Search."}
                  </p>
                </div>
              )}

              {meta && (
                <div className="pt-10 border-t border-slate-200 text-[10px] text-slate-400 uppercase tracking-[0.2em] flex justify-between">
                  <span>Core: {meta.engine}</span>
                  <span>Lexicon: {meta.tokens?.join(', ')}</span>
                  {meta.localCoverage && <span>Coverage: {meta.localCoverage}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <AnalyticsDashboard />
          </div>

        </div>
      </main>
    </div>
  );
};

export default Home;