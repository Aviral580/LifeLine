import React, { useState } from 'react';
import { CheckCircle2, AlertOctagon, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import API from '../../utils/api';

const ResultCard = ({ title, source, trustScore, summary, url }) => {
  const { isEmergency } = useMode();
  const [feedbackSent, setFeedbackSent] = useState(null);
  const isTrusted = trustScore > 75;

  // Track behavior: Clicks boost the document in the ranking loop
  const handleLinkClick = async () => {
    try {
      await API.post('/analytics/log', {
        actionType: 'click_result',
        targetUrl: url,
        sessionId: 'session-' + Math.random().toString(36).substr(2, 9),
        isEmergencyMode: isEmergency
      });
      window.open(url, '_blank');
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  // Human-in-the-loop: Upvote or Downvote for self-learning
  const handleFeedback = async (type) => {
    if (feedbackSent) return;
    try {
      await API.post('/feedback', {
        targetUrl: url,
        feedbackType: type === 'helpful' ? 'upvote' : 'fake_news_report',
        userComment: `User flagged as ${type}`
      });
      setFeedbackSent(type);
    } catch (err) {
      console.error("Feedback failed", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-2xl border transition-all duration-300 group relative",
        isEmergency 
          ? "bg-slate-900 border-red-900/30 hover:border-red-500/50" 
          : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-xl"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {isTrusted ? (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Credible Source
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <AlertOctagon className="w-3 h-3" /> Mixed Credibility
            </span>
          )}
          <span className={cn("text-xs font-medium", isEmergency ? "text-red-300/60" : "text-slate-400")}>
            {source}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <div className={cn("text-2xl font-black tabular-nums", isTrusted ? "text-emerald-500" : "text-amber-500")}>
            {trustScore}
          </div>
          <span className="text-[8px] uppercase tracking-tighter opacity-50">Trust Index</span>
        </div>
      </div>

      <button 
        onClick={handleLinkClick}
        className={cn(
          "text-left text-xl font-bold mb-3 flex items-start gap-2 group-hover:underline decoration-2 block",
          isEmergency ? "text-red-50 decoration-red-500" : "text-slate-900 decoration-blue-600"
        )}
      >
        {title}
        <ExternalLink size={16} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <p className={cn("text-sm leading-relaxed mb-6 line-clamp-3", isEmergency ? "text-slate-400" : "text-slate-600")}>
        {summary}
      </p>

      {/* FEEDBACK LOOP UI */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100/10">
        <div className="flex gap-3">
          <button 
            disabled={feedbackSent}
            onClick={() => handleFeedback('helpful')}
            className={cn(
              "flex items-center gap-2 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition-all",
              feedbackSent === 'helpful' 
                ? "bg-emerald-500 text-white" 
                : "bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-800"
            )}
          >
            <ThumbsUp className="w-3 h-3" /> {feedbackSent === 'helpful' ? "Thank You" : "Helpful"}
          </button>
          
          <button 
            disabled={feedbackSent}
            onClick={() => handleFeedback('fake')}
            className={cn(
              "flex items-center gap-2 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition-all",
              feedbackSent === 'fake' 
                ? "bg-red-500 text-white" 
                : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800"
            )}
          >
            <ThumbsDown className="w-3 h-3" /> {feedbackSent === 'fake' ? "Reported" : "Fake News"}
          </button>
        </div>
        
        <span className="text-[9px] text-slate-400 italic">ID: {Math.random().toString(36).substr(2, 5)}</span>
      </div>
    </motion.div>
  );
};

export default ResultCard;