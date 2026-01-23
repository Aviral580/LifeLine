import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertOctagon, ThumbsUp, ThumbsDown, ExternalLink, Activity } from 'lucide-react';
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import API from '../../utils/api';

const ResultCard = ({ title, source, trustScore, summary, url }) => {
  const { isEmergency } = useMode();
  
  // Use a cleaner key for localStorage (removing protocol/slashes)
  const storageKey = `life_vote_${url.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const [userAction, setUserAction] = useState(null);

  // Sync with storage whenever the URL changes
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setUserAction(saved);
  }, [url, storageKey]);

  const handleLinkClick = async () => {
    try {
      await API.post('/analytics/log', {
        actionType: 'click_result',
        targetUrl: url,
        sessionId: 'session-demo',
        isEmergencyMode: isEmergency
      });
      window.open(url, '_blank');
    } catch (err) { window.open(url, '_blank'); }
  };

  const handleFeedback = async (type) => {
    if (userAction) return; 
    
    try {
      await API.post('/feedback', {
        targetUrl: url,
        feedbackType: type === 'helpful' ? 'upvote' : 'fake_news_report'
      });
      
      setUserAction(type);
      localStorage.setItem(storageKey, type);
    } catch (err) {
      console.error("Feedback failed", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-2xl border transition-all duration-300",
        isEmergency ? "bg-slate-900 border-red-900/30" : "bg-white border-slate-200"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60">
           <Activity size={14} /> {source}
        </div>
        <div className="flex flex-col items-end">
          <div className={cn("text-2xl font-black tabular-nums", trustScore > 60 ? "text-emerald-500" : "text-amber-500")}>
            {trustScore}
          </div>
          <span className="text-[8px] uppercase opacity-50">Trust Score</span>
        </div>
      </div>

      <button onClick={handleLinkClick} className="text-left w-full group mb-3">
        <h3 className={cn(
          "text-xl font-bold flex items-center gap-2",
          isEmergency ? "text-white group-hover:text-red-500" : "text-slate-900 group-hover:text-blue-600"
        )}>
          {title} <ExternalLink size={14} className="opacity-40" />
        </h3>
      </button>

      <p className="text-sm opacity-70 mb-6 line-clamp-2">{summary}</p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100/10">
        <div className="flex gap-4">
          
          {/* HELPFUL BUTTON */}
          <button 
            onClick={() => handleFeedback('helpful')}
            className={cn(
              "flex items-center gap-2 text-[10px] font-bold uppercase px-4 py-2 rounded-lg transition-all border shadow-sm",
              userAction === 'helpful' 
                ? "bg-emerald-600 text-white border-emerald-600 !opacity-100 shadow-emerald-500/20" 
                : (userAction ? "opacity-20 cursor-not-allowed" : "hover:bg-emerald-50 hover:text-emerald-600 border-slate-200 text-slate-400")
            )}
          >
            <ThumbsUp size={14} /> {userAction === 'helpful' ? "Learned" : "Helpful"}
          </button>
          
          {/* FAKE NEWS BUTTON */}
          <button 
            onClick={() => handleFeedback('fake')}
            className={cn(
              "flex items-center gap-2 text-[10px] font-bold uppercase px-4 py-2 rounded-lg transition-all border shadow-sm",
              userAction === 'fake' 
                ? "bg-red-600 text-white border-red-600 !opacity-100 shadow-red-500/20" 
                : (userAction ? "opacity-20 cursor-not-allowed" : "hover:bg-red-50 hover:text-red-600 border-slate-200 text-slate-400")
            )}
          >
            <ThumbsDown size={14} /> {userAction === 'fake' ? "Reported" : "Fake News"}
          </button>
        </div>

        {userAction && (
          <span className="text-[10px] font-bold text-slate-500 animate-pulse uppercase">Database Updated</span>
        )}
      </div>
    </motion.div>
  );
};

export default ResultCard;