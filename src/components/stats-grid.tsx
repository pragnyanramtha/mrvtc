"use client";

import { StudentResult } from "@/types";
import { motion } from "framer-motion";

interface StatsGridProps {
    data: StudentResult[];
}

export default function StatsGrid({ data }: StatsGridProps) {
    const sortedData = [...data].sort((a, b) => b.total.localeCompare(a.total)); // Sort by score descending

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
                        <div className={`text-2xl font-black italic ${getGradeColor(result.grade)}`}>
                            {result.grade}
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

                    <div className="grid grid-cols-4 gap-2 relative z-10 font-mono">
                        <div className="bg-slate-800/50 rounded p-1.5 text-center">
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Int</div>
                            <div className="text-sm font-bold text-slate-300">{result.internalMarks}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded p-1.5 text-center">
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Ext</div>
                            <div className="text-sm font-bold text-slate-300">{result.externalMarks}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded p-1.5 text-center">
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Crd</div>
                            <div className="text-sm font-bold text-slate-300">{result.credits}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded p-1.5 text-center border border-cyan-500/20">
                            <div className="text-[9px] text-cyan-500 uppercase tracking-wider mb-0.5">Tot</div>
                            <div className="text-sm font-bold text-white">{result.total}</div>
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
