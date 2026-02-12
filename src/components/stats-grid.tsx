"use client";

import { StudentResult } from "@/types";
import { motion } from "framer-motion";

interface StatsGridProps {
    data: StudentResult[];
}

export default function StatsGrid({ data }: StatsGridProps) {
    // Sort by grade points high to low, then by total marks high to low
    const sortedData = [...data].sort((a, b) => {
        const gpA = Number(a.gradePoints) || 0;
        const gpB = Number(b.gradePoints) || 0;
        if (gpB !== gpA) return gpB - gpA;
        return (Number(b.total) || 0) - (Number(a.total) || 0);
    });

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, scale: 0.9 },
        show: { opacity: 1, scale: 1 },
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
        >
            {sortedData.map((result, idx) => (
                <motion.div
                    key={result.courseCode}
                    variants={item}
                    className="relative bg-slate-900 border border-slate-800 p-4 transition-all hover:bg-slate-800/50 hover:border-cyan-500/30 group overflow-hidden"
                >
                    {/* Tech details */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-slate-700/50 group-hover:border-cyan-400 transition-colors" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-slate-700/50 group-hover:border-cyan-400 transition-colors" />

                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div>
                            <div className="text-[10px] text-cyan-600 font-mono tracking-widest uppercase mb-1">
                                {result.courseCode}
                            </div>
                            <h3 className="text-sm font-bold text-white leading-tight uppercase max-w-[80%]">
                                {result.course}
                            </h3>
                        </div>
                    </div>

                    <div className="w-full bg-slate-800 h-1 mt-4 mb-4 relative overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(parseInt(result.total || "0"), 100)}%` }}
                            transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                            className={`h-full ${getBarColor(result.grade)}`}
                        />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 font-mono mt-4">
                        <div className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Internal</span>
                            <span className="text-lg font-bold text-slate-200">{result.internalMarks}</span>
                        </div>
                        <div className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">External</span>
                            <span className="text-lg font-bold text-slate-200">{result.externalMarks}</span>
                        </div>
                        <div className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
                            <span className="text-lg font-bold text-white">{result.total}</span>
                        </div>
                        <div className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Credits</span>
                            <span className="text-lg font-bold text-blue-400">{result.credits}</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-2">
                            <div className={`px-2 py-0.5 rounded textxs font-bold uppercase tracking-wider ${result.status === "Pass" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                                {result.status}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-500 mr-2 uppercase tracking-wider">Grade</span>
                            <span className={`text-2xl font-black italic ${getGradeColor(result.grade)}`}>
                                {result.grade}
                            </span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}

function getGradeColor(grade: string | null) {
    if (!grade) return "text-slate-600";
    const g = grade.toUpperCase();
    if (g === "O") return "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]";
    if (g === "A+") return "text-emerald-400";
    if (g === "A") return "text-emerald-500";
    if (g === "B+") return "text-cyan-400";
    if (g.includes("B")) return "text-blue-400";
    if (g.includes("C")) return "text-indigo-400";
    if (g === "F" || g === "FAIL") return "text-red-500";
    return "text-slate-300";
}

function getBarColor(grade: string | null) {
    if (!grade) return "bg-slate-600";
    const g = grade.toUpperCase();
    if (g === "O") return "bg-yellow-500";
    if (g === "A+") return "bg-emerald-500";
    if (g === "A") return "bg-emerald-600";
    if (g.includes("B")) return "bg-cyan-500";
    if (g === "F") return "bg-red-600";
    return "bg-slate-500";
}
