import React, { useState, useEffect } from 'react';
import { CheckCircle2, ThumbsUp, ThumbsDown, ExternalLink, Activity } from 'lucide-react';
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import API from '../../utils/api';

const ResultCard = ({ title, source, trustScore, summary, url }) => {
  const { isEmergency } = useMode();
  
  const safeUrl = url ? url.replace(/[^a-zA-Z0-9]/g, '') : 'default_card';
  const storageKey = `life_vote_${safeUrl}`;
  
  const [userAction, setUserAction] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setUserAction(saved);
  }, [storageKey]);

  const handleLinkClick = () => {
    // 1. SET THE TRAP: Save time & url before they leave
    localStorage.setItem('last_click_ts', Date.now());
    localStorage.setItem('last_click_url', url);

    sessionStorage.setItem('last_click_ts', Date.now());
    sessionStorage.setItem('last_click_url', url);

    // 2. Log the click normally
    API.post('/analytics/log', {
      actionType: 'click_result',
      targetUrl: url,
      sessionId: sessionStorage.getItem('lifeline_sid') || 'session-unknown',
      isEmergencyMode: isEmergency,
      timestamp: Date.now()
    }).catch(err => console.log("Log failed but continuing"));
    
    window.open(url, '_blank');
  };

  const handleFeedback = async (type) => {
    if (userAction) return; 

    // Optimistic UI Update
    setUserAction(type);
    localStorage.setItem(storageKey, type);

    // Explicit Impact Values: Helpful = +5, Fake = -20
    const impact = type === 'helpful' ? 5 : -20;

    try {
      await API.post('/feedback', {
        targetUrl: url,
        feedbackType: type === 'helpful' ? 'upvote' : 'fake_news_report',
        trustScoreImpact: impact // Send explicit impact to backend
      });
    } catch (err) {
      console.error("Feedback failed to save:", err);
    }
  };

  // ... (Your existing Return JSX remains identical) ...
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-2xl border transition-all duration-300 mb-4",
        isEmergency 
          ? "bg-slate-900 border-red-900/30 hover:border-red-500/50" 
          : "bg-white border-slate-100 hover:border-blue-300 hover:shadow-lg"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60">
           <Activity size={14} /> {source || "Unknown Source"}
        </div>
        <div className="flex flex-col items-end">
          <div className={cn("text-2xl font-black tabular-nums", 
            trustScore > 75 ? "text-emerald-500" : (trustScore < 45 ? "text-red-500" : "text-amber-500")
          )}>
            {trustScore}
          </div>
          <span className="text-[8px] uppercase opacity-50">Trust Score</span>
        </div>
      </div>

      <button onClick={handleLinkClick} className="text-left w-full group mb-2 outline-none">
        <h3 className={cn(
          "text-xl font-bold flex items-center gap-2 leading-tight group-hover:underline decoration-2",
          isEmergency ? "text-white decoration-red-500" : "text-slate-900 decoration-blue-500"
        )}>
          {title} <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
      </button>

      <p className={cn("text-sm mb-4 line-clamp-2", isEmergency ? "text-slate-400" : "text-slate-600")}>
        {summary}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100/10">
        <div className="flex gap-3">
          <button 
            onClick={() => handleFeedback('helpful')}
            className={cn(
              "flex items-center gap-2 text-[10px] font-bold uppercase px-4 py-2 rounded-lg border transition-all",
              userAction === 'helpful'
                ? "!bg-emerald-600 !text-white !border-emerald-600 shadow-md"
                : userAction 
                  ? "opacity-30 cursor-not-allowed border-transparent"
                  : "hover:bg-emerald-50 hover:text-emerald-600 border-slate-200 text-slate-400 bg-transparent"
            )}
          >
            <ThumbsUp size={14} /> {userAction === 'helpful' ? "Verified" : "Helpful"}
          </button>
          
          <button 
            onClick={() => handleFeedback('fake')}
            className={cn(
              "flex items-center gap-2 text-[10px] font-bold uppercase px-4 py-2 rounded-lg border transition-all",
              userAction === 'fake'
                ? "!bg-red-600 !text-white !border-red-600 shadow-md"
                : userAction 
                  ? "opacity-30 cursor-not-allowed border-transparent"
                  : "hover:bg-red-50 hover:text-red-600 border-slate-200 text-slate-400 bg-transparent"
            )}
          >
            <ThumbsDown size={14} /> {userAction === 'fake' ? "Reported" : "Fake News"}
          </button>
        </div>

        {userAction && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 animate-pulse">
            <CheckCircle2 size={12} className="text-blue-500"/> Input Recorded
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default ResultCard;