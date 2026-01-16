
import React from 'react';

import Navbar from '../components/layout/Navbar';

import SearchInterface from '../features/search/SearchInterface';

import AnalyticsDashboard from '../features/analytics/AnalyticsDashboard';

import ResultCard from '../features/search/ResultCard';

import { useMode } from '../context/ModeContext';

import { cn } from '../utils/cn';



const Home = () => {

  const { isEmergency } = useMode();



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



            <SearchInterface />



            <div className="space-y-4">

              <ResultCard 

                title="Earthquake Safety Guidelines 2024"

                source="National Disaster Management Authority"

                trustScore={98}

                summary="Official protocols for structural safety, evacuation routes, and emergency kit preparation during seismic activities."

              />

              <ResultCard 

                title="Local Relief Camps Locations"

                source="City Municipal Corp"

                trustScore={92}

                summary="Updated list of operational relief camps with capacity status and medical facilities availability."

              />

               <ResultCard 

                title="Unverified Report: Bridge Collapse"

                source="Social Media Aggregator"

                trustScore={45}

                summary="User generated reports claiming bridge damage. NOT VERIFIED by official engineering teams yet."

              />

            </div>

          </div>



          {/* Sidebar: Analytics & User Stats (Abhay's Domain) */}

          <div className="lg:col-span-4 space-y-6">

            <AnalyticsDashboard />

            

            {/* Feedback Loop Call to Action */}

            <div className={cn(

              "p-6 rounded-2xl border", 

              isEmergency ? "bg-red-900/20 border-red-500/30" : "bg-indigo-900 text-white border-indigo-800"

            )}>

              <h4 className="font-bold mb-2">Help Improve Accuracy</h4>

              <p className="text-sm opacity-80 mb-4">

                Your clicks and time-on-page metrics help us filter misinformation in real-time.

              </p>

              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">

                <div className="bg-emerald-400 h-full w-[75%]"></div>

              </div>

              <p className="text-xs mt-2 text-right">Contribution Score: 750</p>

            </div>

          </div>



        </div>

      </main>

    </div>

  );

};



export default Home;

