import React, { useState, useEffect, useRef } from "react";
import SearchInterface from "../SearchInterface";
import ResultCard from "../ResultCard";
import API from "../../../utils/api";
import { useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [language, setLanguage] = useState("en");
  const [source, setSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q");

  const sessionId = React.useMemo(() => {
    const existing = localStorage.getItem("lifeline_session_id");
    if (existing) return existing;
    const newId = uuidv4();
    localStorage.setItem("lifeline_session_id", newId);
    return newId;
  }, []);

  const searchStartRef = useRef(null);
  const clickedRef = useRef(false);

  useEffect(() => {
    if (queryFromUrl) {
      handleSearch(queryFromUrl, true, 1);
    }
  }, [queryFromUrl]);

  // Pogo-sticking detection (time spent + bounce)
  useEffect(() => {
    const handleUnload = async () => {
      const durationSeconds = Math.floor((Date.now() - (searchStartRef.current || Date.now())) / 1000);

      await API.post("/analytics/log", {
        sessionId,
        actionType: "time_on_page",
        query: searchQuery,
        targetUrl: "search_page",
        timeSpentSeconds: durationSeconds,
        isEmergencyMode: false,
      });

      if (!clickedRef.current && durationSeconds < 5 && searchQuery) {
        await API.post("/analytics/log", {
          sessionId,
          actionType: "bounce",
          query: searchQuery,
          targetUrl: "search_page",
          isEmergencyMode: false,
        });
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [searchQuery, sessionId]);

  // Detect pogo-sticking after clicking article (returning fast)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === "visible") {
        const lastClickUrl = sessionStorage.getItem("lastClickUrl");
        const lastClickTime = Number(sessionStorage.getItem("lastClickTime"));

        if (!lastClickUrl || !lastClickTime) return;

        const delta = Date.now() - lastClickTime;

        if (delta < 7000) {
          await API.post("/analytics/log", {
            sessionId,
            actionType: "bounce",
            query: searchQuery,
            targetUrl: lastClickUrl,
            isEmergencyMode: false,
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [searchQuery, sessionId]);

  const logAnalytics = async (payload) => {
    try {
      await API.post("/analytics/log", payload);
    } catch (err) {
      console.error("Analytics log failed:", err);
    }
  };

  const handleSearch = async (query, isFromUrl = false, pageNum = 1) => {
    if (!query) return;

    setSearchQuery(query);
    setPage(pageNum);

    searchStartRef.current = Date.now();
    clickedRef.current = false;

    if (!isFromUrl) {
      setRecentSearches((prev) => {
        const newList = [query, ...prev.filter((q) => q !== query)];
        return newList.slice(0, 3);
      });
    }

    logAnalytics({
      sessionId,
      actionType: "search",
      query,
      isEmergencyMode: false,
    });

    try {
      const { data } = await API.get("/news", {
        params: {
          q: query,
          page: pageNum,
          pageSize,
          language,
          sources: source || undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined,
        },
      });

      setResults(data.articles || []);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const refreshResults = () => {
    handleSearch(searchQuery, true, 1);
  };

  const nextPage = () => {
    handleSearch(searchQuery, true, page + 1);
  };

  const prevPage = () => {
    if (page > 1) handleSearch(searchQuery, true, page - 1);
  };

  return (
    <div className="pt-24 px-4">
      <SearchInterface onSearch={(q) => handleSearch(q, false, 1)} />

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Source (optional)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Language (en)"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={refreshResults}
          className="px-4 py-2 rounded bg-slate-800 text-white"
        >
          Refresh
        </button>
      </div>

      {recentSearches.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2">Recent:</h3>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.map((q, idx) => (
              <button
                key={idx}
                className="px-3 py-1 rounded-full bg-slate-200 hover:bg-slate-300"
                onClick={() => handleSearch(q, false, 1)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((article, idx) => (
          <ResultCard
            key={idx}
            title={article.title}
            source={article.source?.name}
            trustScore={Math.floor(Math.random() * 100)}
            summary={article.description || "No summary available"}
            url={article.url}
            sessionId={sessionId}
            onClickLogged={() => { clickedRef.current = true; }}
          />
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <button
          disabled={page === 1}
          onClick={prevPage}
          className="px-4 py-2 rounded bg-slate-200 disabled:opacity-50"
        >
          Prev
        </button>
        <button
          onClick={nextPage}
          className="px-4 py-2 rounded bg-slate-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SearchPage;
