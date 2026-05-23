"use client";

import { useTransition } from "react";
import { useState } from "react";
import { getSemWiseData } from "@/actions/get-sem-wise-data";
import { getSem2Data } from "@/actions/get-sem2-data";
import { StudentResult, Sem2Result } from "@/types";
import { Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StatsChart from "@/components/stats-chart";
import StatsGrid from "@/components/stats-grid";
import Sem2StatsGrid from "@/components/sem2-stats-grid";

type ActiveSem = "sem1" | "sem2";

export default function Home() {
  const [query, setQuery] = useState("");
  const [sem1Data, setSem1Data] = useState<StudentResult[] | null>(null);
  const [sem2Data, setSem2Data] = useState<Sem2Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeSem, setActiveSem] = useState<ActiveSem>("sem1");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setError(null);
    setSem1Data(null);
    setSem2Data(null);

    startTransition(async () => {
      const [sem1Result, sem2Result] = await Promise.all([
        getSemWiseData(query),
        getSem2Data(query),
      ]);

      if (sem1Result.success && sem1Result.data) {
        const dataRecord = sem1Result.data as Record<string, StudentResult[]>;
        const keys = Object.keys(dataRecord);
        if (keys.length > 0) setSem1Data(dataRecord[keys[0]]);
      }

      if (sem2Result.success && sem2Result.data) {
        setSem2Data(sem2Result.data);
      }

      if (!sem1Result.success && !sem2Result.success) {
        setError(sem1Result.error || "No data found for this roll number.");
      }
    });
  };

  const hasData = sem1Data || sem2Data;
  const currentRollNo = sem1Data?.[0]?.rollNo ?? sem2Data?.[0]?.rollNo ?? "";

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black -z-10" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:50px_50px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-4 py-10 md:py-20 flex flex-col items-center min-h-[80vh]">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-16 space-y-4"
        >
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-800 italic uppercase drop-shadow-2xl">
            MRVTC RESULTS
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
            <Search className="h-5 w-5 text-slate-500 ml-4 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ROLL NO."
              className="w-full bg-transparent px-4 py-4 text-base md:text-xl text-white placeholder-slate-600 focus:outline-none focus:ring-0 tracking-widest font-mono uppercase"
            />
            <button
              type="submit"
              disabled={isPending}
              className="flex-shrink-0 mr-2 px-3 md:px-6 py-2 md:py-3 bg-slate-900 hover:bg-slate-800 hover:text-cyan-300 text-cyan-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-800 hover:border-cyan-500/30"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "CHECK"}
            </button>
          </div>
        </motion.form>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 mt-6 bg-red-950/20 border border-red-900/50 px-5 py-3 rounded-lg text-sm font-mono w-full max-w-lg"
            >
              ERROR: {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {hasData && !isPending && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full mt-12 md:mt-20"
            >
              {/* Identity + Sem Selector */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                {/* Identity */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-cyan-500/30 pb-4 mb-5 gap-3">
                  <div>
                    <div className="text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase mb-1">IDENTITY</div>
                    <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase italic break-all">
                      {currentRollNo}
                    </h2>
                  </div>
                  <span className="bg-cyan-950/30 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 font-mono text-xs uppercase tracking-wider whitespace-nowrap">
                    Batch: 2024
                  </span>
                </div>

                {/* Sem Switcher */}
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => setActiveSem("sem1")}
                    disabled={!sem1Data}
                    className={`relative px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-300 border ${
                      activeSem === "sem1"
                        ? "bg-cyan-500/15 border-cyan-500/60 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                        : "bg-slate-900/50 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                    } ${!sem1Data ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {activeSem === "sem1" && (
                      <span className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    )}
                    SEM I
                  </button>
                  <button
                    onClick={() => setActiveSem("sem2")}
                    disabled={!sem2Data}
                    className={`relative px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-300 border ${
                      activeSem === "sem2"
                        ? "bg-amber-500/15 border-amber-500/60 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                        : "bg-slate-900/50 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                    } ${!sem2Data ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {activeSem === "sem2" && (
                      <span className="absolute top-0 left-0 right-0 h-[2px] bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    )}
                    SEM II
                    {!sem2Data && sem1Data && (
                      <span className="ml-1 text-[9px] text-slate-600 normal-case">no data</span>
                    )}
                  </button>
                </div>

                {/* Metrics */}
                {activeSem === "sem1" && sem1Data && <Sem1Metrics data={sem1Data} />}
                {activeSem === "sem2" && sem2Data && <Sem2Metrics data={sem2Data} />}
              </motion.div>

              {/* ── SEM 1 ── */}
              {activeSem === "sem1" && sem1Data && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8"
                >
                  {/* Chart */}
                  <div className="xl:col-span-5 relative bg-slate-900/20 border border-slate-800/50 p-4 backdrop-blur-sm shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)]">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50" />
                    <h3 className="text-center text-cyan-400 font-mono uppercase tracking-widest mb-4 text-xs border-b border-cyan-900/30 pb-2 mx-6">
                      Performance
                    </h3>
                    <StatsChart data={sem1Data.filter(item =>
                      !["GERMAN", "INDIAN KNOWLEDGE SYSTEM"].includes(item.course)
                    )} />
                  </div>

                  {/* Grid */}
                  <div className="xl:col-span-7">
                    <h3 className="text-cyan-400 font-mono uppercase tracking-widest mb-4 text-xs border-b border-cyan-900/30 pb-2">
                      Subject Breakdown
                    </h3>
                    <StatsGrid data={sem1Data} />
                  </div>
                </motion.div>
              )}

              {/* ── SEM 2 ── */}
              {activeSem === "sem2" && sem2Data && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                    <h3 className="text-amber-400 font-mono uppercase tracking-widest text-xs border-b border-amber-900/30 pb-2 flex-1">
                      Sem 2 — Subject Breakdown
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                      Tap a card for details
                    </span>
                  </div>
                  <Sem2StatsGrid data={sem2Data} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// ── Sem1 metrics ──────────────────────────────────────────────────────────────
function Sem1Metrics({ data }: { data: StudentResult[] }) {
  const totalCredits = data.reduce((acc, curr) => acc + (Number(curr.credits) || 0), 0);
  const dueSubjects = data.filter(
    item => item.status !== "Pass" && item.status !== "P" && item.status !== ""
  ).length;
  const cgpa = data[0]?.cgpa || "N/A";

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
      <MetricCard color="emerald" label="CGPA" value={cgpa} />
      <MetricCard color="blue" label="Credits" value={totalCredits.toString()} />
      <MetricCard color={dueSubjects > 0 ? "red" : "slate"} label="Due" value={dueSubjects.toString()} />
    </div>
  );
}

// ── Sem2 metrics ──────────────────────────────────────────────────────────────
function Sem2Metrics({ data }: { data: Sem2Result[] }) {
  const totalCredits = data.reduce((acc, curr) => acc + (Number(curr.credits) || 0), 0);
  const avgMid =
    data.length > 0
      ? (data.reduce((a, c) => a + (parseFloat(c.midTotal) || 0), 0) / data.length).toFixed(1)
      : "—";

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
      <MetricCard color="amber" label="Credits" value={totalCredits.toString()} />
      <MetricCard color="amber" label="Avg Mid" value={avgMid} />
      <MetricCard color="slate" label="Subjects" value={data.length.toString()} />
    </div>
  );
}

// ── Generic metric card ───────────────────────────────────────────────────────
type CardColor = "emerald" | "blue" | "red" | "amber" | "slate";

const colorMap: Record<CardColor, { text: string; ring: string }> = {
  emerald: { text: "text-emerald-400", ring: "border-4 border-emerald-500" },
  blue:    { text: "text-blue-400",    ring: "border-4 border-blue-500" },
  red:     { text: "text-red-500",     ring: "border-4 border-red-500" },
  amber:   { text: "text-amber-400",   ring: "border-4 border-amber-500" },
  slate:   { text: "text-slate-500",   ring: "border-4 border-slate-500" },
};

function MetricCard({ color, label, value }: { color: CardColor; label: string; value: string }) {
  const c = colorMap[color];
  return (
    <div className="bg-slate-900/50 border border-slate-800 px-3 py-4 md:p-6 rounded-xl md:rounded-2xl backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 md:p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full ${c.ring}`} />
      </div>
      <div className="text-[9px] md:text-sm text-slate-400 font-mono uppercase tracking-widest mb-1 md:mb-2">{label}</div>
      <div className={`text-2xl md:text-4xl font-bold font-mono ${c.text}`}>{value}</div>
    </div>
  );
}
