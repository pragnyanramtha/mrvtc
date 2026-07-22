"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, CalendarCheck } from "lucide-react";
import MarksView from "@/components/marks-view";
import AttendanceView from "@/components/attendance-view";

type Tab = "marks" | "attendance";

const TABS: { id: Tab; label: string; icon: typeof GraduationCap }[] = [
  { id: "marks", label: "Marks", icon: GraduationCap },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("marks");

  return (
    <main className="results-shell min-h-screen text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      <div className="results-bg" aria-hidden="true">
        <div className="results-bg__circuit" />
        <div className="results-bg__horizon" />
        <div className="results-bg__scan" />
      </div>

      <div className="container mx-auto px-4 py-10 md:py-20 flex flex-col items-center min-h-[80vh] relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 md:mb-12 space-y-4"
        >
          <h1 className="inline-block px-3 md:px-5 text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-800 italic uppercase drop-shadow-2xl">
            {activeTab === "marks" ? "TEST RESULTS" : "ATTENDANCE"}
          </h1>
          <div className="h-1 w-24 bg-cyan-500 mx-auto rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
        </motion.div>

        {/* Top Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center gap-1 p-1 mb-10 md:mb-14 bg-black/60 backdrop-blur-xl border border-slate-800 rounded-2xl"
          role="tablist"
          aria-label="View"
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-colors ${
                  active ? "text-black" : "text-slate-400 hover:text-cyan-300"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-cyan-400 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Active view */}
        <div className="w-full flex flex-col items-center">
          {activeTab === "marks" ? <MarksView /> : <AttendanceView />}
        </div>
      </div>
    </main>
  );
}
