import React from "react";
import Navbar from "../components/layout/Navbar";
import SearchInterface from "../features/search/SearchInterface";
import AnalyticsDashboard from "../features/analytics/AnalyticsDashboard";
import { useMode } from "../context/ModeContext";
import { cn } from "../utils/cn";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { isEmergency } = useMode();
  const navigate = useNavigate();

  const handleSearch = async (query) => {
    if (!query) return;

    try {
      await API.post("/analytics/log", {
        sessionId: "session-" + Math.random().toString(36).slice(2),
        actionType: "search",
        query,
        isEmergencyMode: isEmergency,
      });
    } catch (err) {
      console.error("Analytics log failed", err);
    }

    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className={cn("min-h-screen", isEmergency ? "bg-[#0a0a0a]" : "bg-slate-50")}>
      <Navbar />

      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="text-center mb-12">
              <h1 className={cn("text-4xl md:text-6xl font-black", isEmergency ? "text-white" : "text-slate-900")}>
                {isEmergency ? "CRITICAL INFORMATION" : "Search with Confidence"}
              </h1>
            </div>

            <SearchInterface onSearch={handleSearch} />
          </div>

          <div className="lg:col-span-4">
            <AnalyticsDashboard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
