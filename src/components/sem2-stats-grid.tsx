"use client";

import { Sem2Result } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowRight, X } from "lucide-react";

interface Sem2StatsGridProps {
    data: Sem2Result[];
}

export default function Sem2StatsGrid({ data }: Sem2StatsGridProps) {
    const [selectedSubject, setSelectedSubject] = useState<Sem2Result | null>(null);
    const sortedData = [...data].sort((a, b) => {
        const rankA = getBottomSubjectRank(a.courseName);
        const rankB = getBottomSubjectRank(b.courseName);
        if (rankA !== rankB) return rankA - rankB;

        const marksA = getProgressMarks(a);
        const marksB = getProgressMarks(b);
        if (marksB !== marksA) return marksB - marksA;

        return a.courseCode.localeCompare(b.courseCode);
    });

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.06 },
        },
    };

    const item = {
        hidden: { opacity: 0, scale: 0.92 },
        show: { opacity: 1, scale: 1 },
    };

    const openDetails = (result: Sem2Result) => {
        setSelectedSubject(result);
    };

    return (
        <>
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
                        className="relative bg-slate-900 border border-slate-800 p-4 transition-all hover:bg-slate-800/50 hover:border-amber-500/30 group overflow-hidden cursor-pointer"
                        onClick={() => openDetails(result)}
                    >
                        {/* Corner accents - amber theme for sem2 */}
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-slate-700/50 group-hover:border-amber-400 transition-colors" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-slate-700/50 group-hover:border-amber-400 transition-colors" />

                        {/* Subject header */}
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <div className="text-[10px] text-amber-500/70 font-mono tracking-widest uppercase mb-1">
                                    {result.courseCode}
                                </div>
                                <h3 className="text-sm font-bold text-white leading-tight uppercase max-w-[85%]">
                                    {result.courseName}
                                </h3>
                            </div>
                        </div>

                        {/* Progress bar based on final total when available */}
                        <div className="w-full bg-slate-800 h-1 mt-4 mb-4 relative overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(getProgressMarks(result), 100)}%` }}
                                transition={{ duration: 1, delay: 0.4 + idx * 0.08 }}
                                className={`h-full ${getBarColor(result.grade)}`}
                            />
                        </div>

                        {/* Mid 1 | Mid 2 | External | Total */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10 font-mono mt-4">
                            <div className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Mid 1</span>
                                <span className="text-lg font-bold text-slate-200">
                                    {formatMark(result.mid1Total)}
                                </span>
                            </div>
                            <div className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Mid 2</span>
                                <span className="text-lg font-bold text-slate-200">
                                    {formatMark(result.mid2Total)}
                                </span>
                            </div>
                            <div className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">External</span>
                                <span className={`text-lg font-bold ${hasMark(result.externalMarks) ? 'text-amber-300' : 'text-slate-500'}`}>
                                    {formatMark(result.externalMarks)}
                                </span>
                            </div>
                            <div className="flex flex-col bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
                                <span className="text-lg font-bold text-white">
                                    {formatMark(result.total)}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-2">
                                <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                    isPassingStatus(result.status)
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        : result.status
                                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            : 'bg-slate-800/50 text-slate-500 border border-slate-700'
                                }`}>
                                    {result.status || 'Pending'}
                                </div>
                                <span className="text-xs text-slate-600 font-mono">{result.credits} cr</span>
                            </div>
                            <div className="text-right flex items-baseline gap-2">
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Grade</span>
                                <span className={`text-2xl font-black italic ${getGradeColor(result.grade)}`}>
                                    {result.grade || '—'}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                openDetails(result);
                            }}
                            className="mt-3 w-full h-9 inline-flex items-center justify-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15 hover:border-amber-400/60 transition-colors font-mono text-[11px] uppercase tracking-widest"
                        >
                            Details
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </motion.div>
                ))}
            </motion.div>

            {/* Subject Detail Modal */}
            <AnimatePresence>
                {selectedSubject && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedSubject(null)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-slate-950 border border-amber-500/30 shadow-[0_0_60px_-10px_rgba(245,158,11,0.3)] p-5 md:p-6 overflow-y-auto max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative corners */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-500/60" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-500/60" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-500/60" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-500/60" />

                            {/* Close button */}
                            <button
                                onClick={() => setSelectedSubject(null)}
                                aria-label="Close subject details"
                                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Header */}
                            <div className="mb-6">
                                <div className="text-[10px] text-amber-500/70 font-mono tracking-widest uppercase mb-1">
                                    {selectedSubject.courseCode}
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                    {selectedSubject.courseName}
                                </h3>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                        isPassingStatus(selectedSubject.status)
                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                            : selectedSubject.status
                                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                : 'bg-slate-800/50 text-slate-500 border border-slate-700'
                                    }`}>
                                        {selectedSubject.status || 'Pending'}
                                    </div>
                                    <span className="text-xs text-slate-600 font-mono">{selectedSubject.credits} cr</span>
                                </div>
                                <div className="h-0.5 w-12 bg-amber-500 mt-3 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                            </div>

                            {/* Mid 1 breakdown */}
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-amber-400 font-mono uppercase tracking-widest">Mid 1</span>
                                    <span className="text-lg font-bold text-white font-mono">{formatMark(selectedSubject.mid1Total)}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { label: 'Presentation', val: selectedSubject.mid1Presentation },
                                        { label: 'Assignment', val: selectedSubject.mid1Assignment },
                                        { label: 'Objective', val: selectedSubject.mid1Objective },
                                        { label: 'Subjective', val: selectedSubject.mid1Subject },
                                    ].map(({ label, val }) => (
                                        <div key={label} className="flex flex-col bg-slate-900 p-2 rounded border border-slate-800 text-center">
                                            <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{label}</span>
                                            <span className="text-base font-bold text-slate-200 font-mono">{formatMark(val)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-slate-800 mb-5" />

                            {/* Mid 2 breakdown */}
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-amber-400 font-mono uppercase tracking-widest">Mid 2</span>
                                    <span className="text-lg font-bold text-white font-mono">{formatMark(selectedSubject.mid2Total)}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { label: 'Presentation', val: selectedSubject.mid2Presentation },
                                        { label: 'Assignment', val: selectedSubject.mid2Assignment },
                                        { label: 'Objective', val: selectedSubject.mid2Objective },
                                        { label: 'Subjective', val: selectedSubject.mid2Subject },
                                    ].map(({ label, val }) => (
                                        <div key={label} className="flex flex-col bg-slate-900 p-2 rounded border border-slate-800 text-center">
                                            <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{label}</span>
                                            <span className="text-base font-bold text-slate-200 font-mono">{formatMark(val)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-slate-800 mb-5" />

                            {/* Summary row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="flex flex-col bg-slate-900/60 p-3 rounded border border-slate-800 text-center">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Mid Total</span>
                                    <span className="text-xl font-black text-amber-400 font-mono">{formatMark(selectedSubject.midTotal)}</span>
                                </div>
                                <div className="flex flex-col bg-slate-900/60 p-3 rounded border border-slate-800 text-center">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">External</span>
                                    <span className={`text-xl font-black font-mono ${hasMark(selectedSubject.externalMarks) ? 'text-amber-300' : 'text-slate-500'}`}>
                                        {formatMark(selectedSubject.externalMarks)}
                                    </span>
                                </div>
                                <div className="flex flex-col bg-slate-900/60 p-3 rounded border border-slate-800 text-center">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total</span>
                                    <span className="text-xl font-black text-white font-mono">{formatMark(selectedSubject.total)}</span>
                                </div>
                                <div className="flex flex-col bg-slate-900/60 p-3 rounded border border-slate-800 text-center">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Grade</span>
                                    <span className={`text-xl font-black italic ${getGradeColor(selectedSubject.grade)}`}>
                                        {selectedSubject.grade || '—'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function hasMark(value: string | null | undefined) {
    return Boolean(value?.trim());
}

function formatMark(value: string | null | undefined) {
    const text = value?.trim();
    if (!text) return '—';
    return text.replace(/\.0$/, '');
}

function numericMark(value: string | null | undefined) {
    const mark = Number(value);
    return Number.isFinite(mark) ? mark : null;
}

function getProgressMarks(result: Sem2Result) {
    return numericMark(result.total) ?? numericMark(result.midTotal) ?? 0;
}

function isPassingStatus(status: string | null | undefined) {
    const normalized = status?.trim().toLowerCase();
    return normalized === 'pass' || normalized === 'p';
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
    if (g === "F" || g === "AB" || g === "FAIL") return "text-red-500";
    return "text-slate-300";
}

function getBarColor(grade: string | null) {
    if (!grade) return "bg-amber-500";
    const g = grade.toUpperCase();
    if (g === "O") return "bg-yellow-500";
    if (g === "A+") return "bg-emerald-500";
    if (g === "A") return "bg-emerald-600";
    if (g.includes("B")) return "bg-cyan-500";
    if (g === "F" || g === "AB" || g === "FAIL") return "bg-red-600";
    return "bg-slate-500";
}

function getBottomSubjectRank(courseName: string) {
    const normalized = courseName.toLowerCase();
    if (normalized.includes("employment")) return 1;
    if (normalized.includes("french")) return 2;
    return 0;
}
