import React from 'react';
import Navbar from '../components/layout/Navbar';
import SearchInterface from '../features/search/SearchInterface';
import AnalyticsDashboard from '../features/analytics/AnalyticsDashboard';
import ResultCard from '../features/search/ResultCard';
import { useMode } from '../context/ModeContext';
import { cn } from '../utils/cn';
import API from '../utils/api'; // <--- Real Connection

const Home = () => {
  const { isEmergency } = useMode();

  // REAL CONNECTION: Log search to MongoDB
  const handleSearchLog = async (query) => {
    try {
        await API.post('/search/log', {
            query: query,
            sessionId: 'session-' + Math.random().toString(36).substr(2, 9), // Simple Client ID
            isEmergencyMode: isEmergency
        });
        console.log("Search logged to Analytics DB");
        // Here is where Arushi's Code would fetch results:
        // const results = await fetchSearchResults(query);
    } catch (error) {
        console.error("Failed to log search:", error);
    }
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-500", isEmergency ? "bg-[#0a0a0a]" : "bg-slate-50")}>
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Main Search & Results Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="text-center mb-12">
              <h1 className={cn("text-4xl md:text-6xl font-black mb-4 tracking-tighter", isEmergency ? "text-white" : "text-slate-900")}>
                {isEmergency ? "CRITICAL INFORMATION" : "Search with Confidence."}
              </h1>
              <p className={cn("text-lg", isEmergency ? "text-red-200" : "text-slate-500")}>
                {isEmergency 
                  ? "Emergency Mode Active: Showing only verified authorities." 
                  : "Powered by Trust-Score Algorithms and Real-Time Verification."}
              </p>
            </div>

            {/* Pass the real logger function */}
            <SearchInterface onSearch={handleSearchLog} />

            <div className="space-y-4">
              {/* Arushi's Missing Component Placeholder */}
              <div className="p-4 border border-dashed rounded-lg opacity-50 text-center">
                 <p className="text-sm">
                    ⚠️ Real Search Results unavailable.<br/>
                    Waiting for <b>Arushi Agrawal</b> to implement <code>newsService.js</code>
                 </p>
              </div>
              
              {/* Fallback Static Cards (so UI isn't empty) */}
              <ResultCard 
                title="Earthquake Safety Guidelines 2024"
                source="National Disaster Management Authority"
                trustScore={98}
                summary="Official protocols for structural safety, evacuation routes, and emergency kit preparation during seismic activities."
              />
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
