import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useMode } from '../../context/ModeContext';
import { cn } from '../../utils/cn';
const Navbar = () => {
  const { isEmergency, toggleEmergency } = useMode();
  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md border-b transition-all duration-500",
      isEmergency ? "bg-red-950/80 border-red-800" : "bg-white/80 border-slate-200"
    )}>
      <div className="flex items-center gap-2">
        <div className={cn("p-2 rounded-lg", isEmergency ? "bg-red-600" : "bg-blue-600")}>
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <h1 className={cn("text-xl font-bold tracking-tight", isEmergency ? "text-red-100" : "text-slate-900")}>
          ErrorMachine
        </h1>
      </div>
      <button 
        onClick={toggleEmergency}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all shadow-lg hover:scale-105 active:scale-95",
          isEmergency 
            ? "bg-white text-red-700 shadow-red-900/50" 
            : "bg-red-600 text-white shadow-red-200 hover:bg-red-700"
        )}
      >
        <AlertTriangle className={cn("w-4 h-4", isEmergency && "animate-pulse")} />
        {isEmergency ? "EXIT EMERGENCY MODE" : "EMERGENCY TOGGLE"}
      </button>
    </nav>
  );
};
export default Navbar;