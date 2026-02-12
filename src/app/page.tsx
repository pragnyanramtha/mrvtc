"use client";

import { useTransition } from "react";
import { useState } from "react";
import { getSemWiseData } from "@/actions/get-sem-wise-data";
import { StudentResult } from "@/types";
import { Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StatsChart from "@/components/stats-chart";
import StatsGrid from "@/components/stats-grid";

export default function Home() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<StudentResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setError(null);
    setData(null);

    startTransition(async () => {
      const result = await getSemWiseData(query);
      if (result.success && result.data) {
        // Extract the array from the dynamic key
        const keys = Object.keys(result.data);
        if (keys.length > 0) {
          setData(result.data[keys[0]]);
        } else {
          setError("No data found for this roll number.");
        }
      } else {
        setError(result.error || "Failed to fetch data.");
      }
    });
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black -z-10" />

      {/* Grid Background Effect */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:50px_50px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-4 py-10 md:py-20 flex flex-col items-center min-h-[80vh]">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16 space-y-4"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-800 italic uppercase drop-shadow-2xl">
            SEM 2 RESULTS
          </h1>
          <div className="h-1 w-24 bg-cyan-500 mx-auto rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
        </motion.div>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          onSubmit={handleSearch}
          className="w-full max-w-lg relative group z-10"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-2xl opacity-30 group-hover:opacity-100 transition duration-500 blur-lg group-focus-within:opacity-100 group-focus-within:blur-xl" />
          <div className="relative flex items-center bg-black/90 backdrop-blur-xl rounded-2xl border border-slate-800 focus-within:border-cyan-500/50 transition-colors shadow-2xl">
            <Search className="h-6 w-6 text-slate-500 ml-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ENTER ROLL NUMBER"
              className="w-full bg-transparent px-5 py-5 text-lg md:text-xl text-white placeholder-slate-600 focus:outline-none focus:ring-0 tracking-widest font-mono uppercase"
            />
            <button
              type="submit"
              disabled={isPending}
              className="absolute right-3 px-4 md:px-6 py-2 md:py-3 bg-slate-900 hover:bg-slate-800 hover:text-cyan-300 text-cyan-400 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-800 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "CHECK RESULTS"}
            </button>
          </div>
        </motion.form>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 mt-6 bg-red-950/20 border border-red-900/50 px-6 py-3 rounded-lg text-sm font-mono"
            >
              ERROR: {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {data && !isPending && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full mt-20"
            >

              {/* Header Info - HUD Style */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full mb-12"
              >
                {/* Top Row: Identity */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-cyan-500/30 pb-4 mb-6">
                  <div className="text-left">
                    <div className="text-xs text-cyan-500/70 font-mono tracking-widest uppercase mb-1">IDENTITY</div>
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                      {data[0]?.rollNo}
                    </h2>
                  </div>
                  <div className="text-right mt-4 md:mt-0">
                    <span className="bg-cyan-950/30 border border-cyan-500/30 px-4 py-1 rounded-full text-cyan-400 font-mono text-sm uppercase tracking-wider">
                      Batch: {data[0]?.batch}
                    </span>
                  </div>
                </div>

                {/* calculated metrics */}
                {(() => {
                  const totalCredits = data.reduce((acc, curr) => acc + (Number(curr.credits) || 0), 0);
                  const dueSubjects = data.filter(item => item.status !== "Pass").length;
                  const cgpa = data[0]?.cgpa || "N/A";

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <div className="w-16 h-16 rounded-full border-4 border-emerald-500" />
                        </div>
                        <div className="text-sm text-slate-400 font-mono uppercase tracking-widest mb-2">Final CGPA</div>
                        <div className="text-4xl font-bold text-emerald-400 font-mono">{cgpa}</div>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <div className="w-16 h-16 rounded-full border-4 border-blue-500" />
                        </div>
                        <div className="text-sm text-slate-400 font-mono uppercase tracking-widest mb-2">Total Credits</div>
                        <div className="text-4xl font-bold text-blue-400 font-mono">{totalCredits}</div>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <div className="w-16 h-16 rounded-full border-4 border-red-500" />
                        </div>
                        <div className="text-sm text-slate-400 font-mono uppercase tracking-widest mb-2">Due Subjects</div>
                        <div className={`text-4xl font-bold font-mono ${dueSubjects > 0 ? "text-red-500" : "text-slate-500"}`}>
                          {dueSubjects}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>

              <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* Left Column: The Hexagon */}
                <div className="xl:col-span-5 flex flex-col items-center justify-center relative bg-slate-900/20 border border-slate-800/50 rounded-none p-4 backdrop-blur-sm shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)]">
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50" />

                  <div className="w-full relative z-10">
                    {/* Header for Chart */}
                    <h3 className="text-center text-cyan-400 font-mono uppercase tracking-widest mb-4 text-sm border-b border-cyan-900/30 pb-2 mx-10">
                      Performance
                    </h3>
                    <StatsChart data={data.filter(item =>
                      !["GERMAN", "INDIAN KNOWLEDGE SYSTEM"].includes(item.course)
                    )} />
                  </div>
                </div>

                {/* Right Column: The Data Grid */}
                <div className="xl:col-span-7">
                  <h3 className="text-left text-cyan-400 font-mono uppercase tracking-widest mb-4 text-sm border-b border-cyan-900/30 pb-2">
                    Subject Breakdown
                  </h3>
                  <StatsGrid data={data} />
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
