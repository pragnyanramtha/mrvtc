"use client";

import { Sem3Result } from "@/types";
import { motion } from "framer-motion";

interface Sem3StatsGridProps {
    data: Sem3Result[];
}

export default function Sem3StatsGrid({ data }: Sem3StatsGridProps) {
    const sortedData = [...data].sort((a, b) => {
        const typeA = getSubjectTypeRank(a.subjectType);
        const typeB = getSubjectTypeRank(b.subjectType);
        if (typeA !== typeB) return typeA - typeB;

        const marksA = numericMark(a.mid1Marks);
        const marksB = numericMark(b.mid1Marks);
        if ((marksB ?? 0) !== (marksA ?? 0)) return (marksB ?? 0) - (marksA ?? 0);

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
                    className="relative bg-slate-900 border border-slate-800 p-4 transition-all hover:bg-slate-800/50 hover:border-fuchsia-500/30 group overflow-hidden"
                >
                    {/* Corner accents - fuchsia theme for sem3 */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-slate-700/50 group-hover:border-fuchsia-400 transition-colors" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-slate-700/50 group-hover:border-fuchsia-400 transition-colors" />

                    {/* Subject header */}
                    <div className="flex justify-between items-start mb-2 relative z-10 gap-2">
                        <div>
                            <div className="text-[10px] text-fuchsia-500/70 font-mono tracking-widest uppercase mb-1">
                                {result.courseCode}
                            </div>
                            <h3 className="text-sm font-bold text-white leading-tight uppercase max-w-[85%]">
                                {result.courseName}
                            </h3>
                        </div>
                        <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            result.subjectType === 'PRACTICAL'
                                ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                                : 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
                        }`}>
                            {result.subjectType || 'THEORY'}
                        </div>
                    </div>

                    {/* Progress bar based on mid 1 mark (out of 60) */}
                    <div className="w-full bg-slate-800 h-1 mt-4 mb-4 relative overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((numericMark(result.mid1Marks) ?? 0) / 60 * 100, 100)}%` }}
                            transition={{ duration: 1, delay: 0.4 + idx * 0.08 }}
                            className={`h-full ${getBarColor(result.status)}`}
                        />
                    </div>

                    {/* Mid I mark */}
                    <div className="relative z-10 mt-4 flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Mid I</span>
                            <span className="text-3xl font-black text-fuchsia-300 font-mono leading-none mt-1">
                                {formatMark(result.mid1Marks)}
                                <span className="text-sm font-bold text-slate-500 ml-1">/ 60</span>
                            </span>
                        </div>
                        <div className="text-right">
                            <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                isPassingStatus(result.status)
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : result.status
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                        : 'bg-slate-800/50 text-slate-500 border border-slate-700'
                            }`}>
                                {result.status || 'Pending'}
                            </div>
                        </div>
                    </div>

                    {result.splitup && (
                        <div className="relative z-10 mt-3 rounded border border-fuchsia-500/10 bg-fuchsia-950/10 p-3">
                            <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-fuchsia-400/70">
                                Mid I split-up
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(result.splitup).map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between gap-2 text-xs">
                                        <span className="text-slate-400">{label}</span>
                                        <span className="font-mono font-bold text-slate-200">{formatMark(String(value))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center relative z-10">
                        <span className="text-xs text-slate-600 font-mono">III SEM · MID I</span>
                        <span className="text-xs text-slate-600 font-mono uppercase tracking-wider">
                            {formatMark(result.mid1Marks)} / 60
                        </span>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
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

function isPassingStatus(status: string | null | undefined) {
    const normalized = status?.trim().toLowerCase();
    return normalized === 'pass' || normalized === 'p';
}

function getBarColor(status: string | null) {
    if (!status) return "bg-slate-600";
    const normalized = status.trim().toLowerCase();
    if (normalized === 'pass' || normalized === 'p') return "bg-fuchsia-500";
    if (normalized === 'ab' || normalized === 'fail' || normalized === 'f') return "bg-red-600";
    return "bg-slate-500";
}

function getSubjectTypeRank(subjectType: string) {
    return subjectType === 'PRACTICAL' ? 1 : 0;
}
