import React, { useEffect, useState } from "react";
import API from "../../utils/api";

const ResultCard = ({ title, source, summary, url, sessionId }) => {
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("feedbackMap") || "{}");
    setFeedback(stored[url] || null);
  }, [url]);

  const saveFeedbackLocal = (type) => {
    const stored = JSON.parse(localStorage.getItem("feedbackMap") || "{}");
    stored[url] = type;
    localStorage.setItem("feedbackMap", JSON.stringify(stored));
    setFeedback(type);
  };

  const handleFeedback = async (type) => {
    saveFeedbackLocal(type);

    await API.post("/analytics/feedback", {
      sessionId,
      query: "",
      targetUrl: url,
      feedbackType: type,
      isEmergencyMode: false,
    });
  };

  const cardClass =
    feedback === "helpful"
      ? "border-emerald-400 bg-emerald-50"
      : feedback === "fake"
      ? "border-rose-400 bg-rose-50"
      : "border-slate-200 bg-white";

  return (
    <div className={`border rounded p-4 transition-colors duration-300 ${cardClass}`}>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-gray-600">{source}</p>
      <p className="mt-2">{summary}</p>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => handleFeedback("helpful")}
          className={`px-3 py-1 rounded font-semibold transition ${
            feedback === "helpful"
              ? "bg-emerald-600 text-white"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          Helpful
        </button>

        <button
          onClick={() => handleFeedback("fake")}
          className={`px-3 py-1 rounded font-semibold transition ${
            feedback === "fake"
              ? "bg-rose-600 text-white"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          Fake
        </button>
      </div>
    </div>
  );
};

export default ResultCard;
