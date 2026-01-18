import React from 'react';
import { CheckCircle2, AlertOctagon, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

const ResultCard = ({ title, source, trustScore, summary }) => {
  const { isEmergency } = useMode();
  const isTrusted = trustScore > 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-2xl border transition-all duration-300 group hover:shadow-lg",
        isEmergency
          ? "bg-slate-900 border-red-900/30 hover:border-red-500/50"
          : "bg-white border-slate-100 hover:border-blue-200"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 mb-2">
          {isTrusted ? (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-100 text-amber-700">
              <AlertOctagon className="w-3 h-3" /> Unverified
            </span>
          )}

          <span className={cn("text-xs", isEmergency ? "text-red-300" : "text-slate-400")}>
            {source}
          </span>
        </div>

        <div className={cn("text-2xl font-bold", isTrusted ? "text-emerald-500" : "text-amber-500")}>
          {trustScore}
        </div>
      </div>

      <h3
        className={cn(
          "text-xl font-bold mb-2 group-hover:underline decoration-2",
          isEmergency ? "text-red-50 decoration-red-500" : "text-slate-900 decoration-blue-500"
        )}
      >
        {title}
      </h3>

      <p className={cn("text-sm leading-relaxed mb-4", isEmergency ? "text-slate-400" : "text-slate-600")}>
        {summary}
      </p>

      <div className="flex gap-4 pt-4 border-t border-dashed border-white/10">
        <button className="flex items-center gap-2 text-xs font-semibold opacity-50 hover:opacity-100 transition">
          <ThumbsUp className="w-4 h-4" /> Helpful
        </button>
        <button className="flex items-center gap-2 text-xs font-semibold opacity-50 hover:opacity-100 transition">
          <ThumbsDown className="w-4 h-4" /> Fake News
        </button>
      </div>
    </motion.div>
  );
};

export default ResultCard;
