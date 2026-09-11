"use client";

import { useState, useTransition } from "react";
import { getSemWiseData } from "@/actions/get-sem-wise-data";
import { getSem2Data } from "@/actions/get-sem2-data";
import { getSem3Data } from "@/actions/get-sem3-data";
import { StudentResult, Sem2Result, Sem3Result } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import StatsGrid from "@/components/stats-grid";
import Sem2StatsGrid from "@/components/sem2-stats-grid";
import Sem3StatsGrid from "@/components/sem3-stats-grid";
import StudentSearch from "@/components/student-search";

export default function MarksView() {
    const [sem1Data, setSem1Data] = useState<StudentResult[] | null>(null);
    const [sem2Data, setSem2Data] = useState<Sem2Result[] | null>(null);
    const [sem3Data, setSem3Data] = useState<Sem3Result[] | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSelect = (rollNo: string, name?: string) => {
        setError(null);
        setSem1Data(null);
        setSem2Data(null);
        setSem3Data(null);
        setDisplayName(name ?? null);

        startTransition(async () => {
            const [sem1Result, sem2Result, sem3Result] = await Promise.all([
                getSemWiseData(rollNo),
                getSem2Data(rollNo),
                getSem3Data(rollNo),
            ]);

            if (sem1Result.success && sem1Result.data) {
                const dataRecord = sem1Result.data as Record<string, StudentResult[]>;
                const keys = Object.keys(dataRecord);
                if (keys.length > 0) setSem1Data(dataRecord[keys[0]]);
            }

            if (sem2Result.success && sem2Result.data) {
                setSem2Data(sem2Result.data);
            }

            if (sem3Result.success && sem3Result.data) {
                setSem3Data(sem3Result.data);
            }

            if (!sem1Result.success && !sem2Result.success && !sem3Result.success) {
                setError(sem1Result.error || "No data found.");
            }
        });
    };

    const hasData = sem1Data || sem2Data || sem3Data;
    const currentRollNo = sem1Data?.[0]?.rollNo ?? sem2Data?.[0]?.rollNo ?? sem3Data?.[0]?.rollNo ?? "";

    return (
        <div className="w-full flex flex-col items-center">
            <StudentSearch onSelect={handleSelect} isPending={isPending} submitLabel="CHECK" />

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

            <AnimatePresence>
                {hasData && !isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full mt-12 md:mt-20"
                    >
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-cyan-500/30 pb-4 mb-5 gap-3">
                                <div>
                                    <div className="text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase mb-1">IDENTITY</div>
                                    {displayName && displayName !== currentRollNo && (
                                        <div className="text-lg font-bold text-slate-300 tracking-wide mb-1 uppercase">
                                            {displayName}
                                        </div>
                                    )}
                                    <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase italic break-all">
                                        {currentRollNo}
                                    </h2>
                                </div>
                                <div className="flex flex-row flex-wrap gap-2">
                                    <span className="bg-cyan-950/30 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 font-mono text-xs uppercase tracking-wider whitespace-nowrap">
                                        Batch: 2025
                                    </span>
                                    {sem3Data && (
                                        <span className="bg-fuchsia-950/30 border border-fuchsia-500/30 px-3 py-1 rounded-full text-fuchsia-400 font-mono text-xs uppercase tracking-wider whitespace-nowrap">
                                            Sem III Active
                                        </span>
                                    )}
                                </div>
                            </div>

                            <UnifiedMetrics sem1Data={sem1Data} sem2Data={sem2Data} />
                        </motion.div>

                        {sem3Data && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                                    <h3 className="text-fuchsia-400 font-mono uppercase tracking-widest text-xs border-b border-fuchsia-900/30 pb-2 flex-1">
                                        Sem III — Mid I Marks
                                    </h3>
                                </div>
                                <Sem3StatsGrid data={sem3Data} />
                            </motion.div>
                        )}

                        {sem2Data && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                                    <h3 className="text-amber-400 font-mono uppercase tracking-widest text-xs border-b border-amber-900/30 pb-2 flex-1">
                                        Sem II — Marks Breakdown
                                    </h3>
                                </div>
                                <Sem2StatsGrid data={sem2Data} />
                            </motion.div>
                        )}

                        {sem1Data && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-10 md:mt-12">
                                <h3 className="text-cyan-400 font-mono uppercase tracking-widest mb-4 text-xs border-b border-cyan-900/30 pb-2">
                                    Sem I — Marks Breakdown
                                </h3>
                                <StatsGrid data={sem1Data} />
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Unified metrics ───────────────────────────────────────────────────────────
type GradeSummaryRow = {
    credits: string;
    gradePoints?: string | null;
    status?: string | null;
};

function UnifiedMetrics({
    sem1Data,
    sem2Data,
}: {
    sem1Data: StudentResult[] | null;
    sem2Data: Sem2Result[] | null;
}) {
    const sem1Summary = getGradeSummary(sem1Data ?? []);
    const sem2Summary = getGradeSummary(sem2Data ?? []);
    const overallSummary = getGradeSummary([
        ...(sem1Data ?? []),
        ...(sem2Data ?? []),
    ]);
    const dueSubjects = countDueSubjects([
        ...(sem1Data ?? []),
        ...(sem2Data ?? []),
    ]);

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4 mb-6">
            <MetricCard color="emerald" label="CGPA" value={formatGradeValue(overallSummary)} />
            <MetricCard color="blue" label="SEM I" value={formatGradeValue(sem1Summary)} />
            <MetricCard color="amber" label="SEM II" value={formatGradeValue(sem2Summary)} />
            <MetricCard color={dueSubjects > 0 ? "red" : "slate"} label="Due" value={dueSubjects.toString()} />
        </div>
    );
}

function getGradeSummary(data: GradeSummaryRow[]) {
    return data.reduce(
        (acc, curr) => {
            if (!curr.gradePoints?.trim()) return acc;

            const gradePoints = Number(curr.gradePoints);
            const credits = Number(curr.credits);

            if (!Number.isFinite(gradePoints) || !Number.isFinite(credits) || credits <= 0) {
                return acc;
            }

            return {
                points: acc.points + gradePoints * credits,
                credits: acc.credits + credits,
            };
        },
        { points: 0, credits: 0 }
    );
}

function formatGradeValue(summary: { points: number; credits: number }) {
    return summary.credits > 0 ? (summary.points / summary.credits).toFixed(2) : "—";
}

function countDueSubjects(data: GradeSummaryRow[]) {
    return data.filter(item => item.status?.trim() && !isPassingStatus(item.status)).length;
}

function isPassingStatus(status: string | null | undefined) {
    const normalized = status?.trim().toLowerCase();
    return normalized === "pass" || normalized === "p";
}

// ── Generic metric card ───────────────────────────────────────────────────────
type CardColor = "emerald" | "blue" | "red" | "amber" | "slate";

const colorMap: Record<CardColor, { text: string; ring: string }> = {
    emerald: { text: "text-emerald-400", ring: "border-4 border-emerald-500" },
    blue: { text: "text-blue-400", ring: "border-4 border-blue-500" },
    red: { text: "text-red-500", ring: "border-4 border-red-500" },
    amber: { text: "text-amber-400", ring: "border-4 border-amber-500" },
    slate: { text: "text-slate-500", ring: "border-4 border-slate-500" },
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
