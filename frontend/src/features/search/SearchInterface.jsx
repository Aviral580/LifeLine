
import React, { useState } from 'react';

import { Search, Mic, ArrowRight } from 'lucide-react';

import { useMode } from '../../context/ModeContext';

import { cn } from '../../utils/cn';



const SearchInterface = () => {

  const { isEmergency } = useMode();

  const [query, setQuery] = useState("");



  return (

    <div className="w-full max-w-2xl mx-auto mb-10">

      <div className="relative group">

        <div className={cn(

          "absolute -inset-1 rounded-full blur opacity-25 transition duration-1000 group-hover:opacity-75",

          isEmergency ? "bg-gradient-to-r from-red-600 to-orange-600" : "bg-gradient-to-r from-blue-400 to-indigo-500"

        )}></div>

        

        <div className={cn(

          "relative flex items-center gap-3 p-4 rounded-full border shadow-2xl transition-colors duration-500",

          isEmergency ? "bg-slate-900 border-red-700" : "bg-white border-white"

        )}>

          <Search className={cn("w-6 h-6", isEmergency ? "text-red-500" : "text-slate-400")} />

          

          <input 

            type="text"

            value={query}

            onChange={(e) => setQuery(e.target.value)}

            placeholder={isEmergency ? "Emergency: Enter keywords (e.g., 'Flood safe routes')..." : "Search trusted sources..."}

            className={cn(

              "flex-1 bg-transparent outline-none text-lg font-medium",

              isEmergency ? "text-white placeholder-red-300/50" : "text-slate-800 placeholder-slate-400"

            )}

          />

          

          <button className="p-2 hover:bg-slate-100/10 rounded-full transition">

            <Mic className={cn("w-5 h-5", isEmergency ? "text-red-500" : "text-slate-400")} />

          </button>

          

          <button className={cn(

            "p-3 rounded-full transition-transform hover:scale-105 active:scale-95",

            isEmergency ? "bg-red-600 text-white" : "bg-slate-900 text-white"

          )}>

            <ArrowRight className="w-5 h-5" />

          </button>

        </div>

      </div>

      

      {/* N-gram Prediction Simulation */}

      {query.length > 0 && (

        <div className={cn(

          "mt-2 mx-4 p-4 rounded-2xl border backdrop-blur-xl absolute z-10 w-full max-w-2xl shadow-xl",

          isEmergency ? "bg-slate-900/90 border-red-800 text-red-100" : "bg-white/90 border-slate-100 text-slate-600"

        )}>

           <p className="text-xs font-bold opacity-50 mb-2">PREDICTED QUERIES (N-GRAM)</p>

           <ul>

             <li className="py-2 hover:opacity-70 cursor-pointer border-b border-white/5">

               {query} <b>updates live</b>

             </li>

             <li className="py-2 hover:opacity-70 cursor-pointer border-b border-white/5">

               {query} <b>verified sources</b>

             </li>

           </ul>

        </div>

      )}

    </div>

  );

};



export default SearchInterface;

