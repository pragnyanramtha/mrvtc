"use client";

import { useState, useTransition } from "react";
import { getAttendance } from "@/actions/get-attendance";
import { getAttendanceStreak } from "@/actions/get-attendance-streak";
import type { AttendanceResult, AttendanceSemester, AttendanceStreak, AttendanceDay } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import StudentSearch from "@/components/student-search";

export default function AttendanceView() {
    const [data, setData] = useState<AttendanceResult | null>(null);
    const [streak, setStreak] = useState<AttendanceStreak | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSelect = (rollNo: string) => {
        setError(null);
        setData(null);
        setStreak(null);
        startTransition(async () => {
            // Consolidated summary and the 15-day streak are independent fetches.
            const [res, streakRes] = await Promise.all([
                getAttendance(rollNo),
                getAttendanceStreak(rollNo),
            ]);
            if (res.success) {
                setData(res.data);
            } else {
                setError(res.error);
            }
            if (streakRes.success) {
                setStreak(streakRes.data);
            }
        });
    };

    const year1 = data?.semesters.filter(s => s.id === "I" || s.id === "II") ?? [];
    const year2 = data?.semesters.filter(s => s.id === "III") ?? [];

    return (
        <div className="w-full flex flex-col items-center">
            <StudentSearch onSelect={handleSelect} isPending={isPending} submitLabel="TRACK" />

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
                {data && !isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full mt-12 md:mt-20"
                    >
                        {/* Identity */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-cyan-500/30 pb-4 mb-6 gap-3">
                            <div>
                                <div className="text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase mb-1">
                                    {data.name}
                                </div>
                                <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase italic break-all">
                                    {data.rollNo}
                                </h2>
                            </div>
                            <span className="bg-cyan-950/30 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 font-mono text-xs uppercase tracking-wider whitespace-nowrap">
                                Section {data.section}
                            </span>
                        </div>

                        {streak && streak.days.length > 0 && (
                            <div className="mb-10">
                                <StreakTimeline streak={streak} />
                            </div>
                        )}

                        {year2.length > 0 && (
                            <YearBlock title="Year 2 — Current" accent="amber" semesters={year2} />
                        )}
                        {year1.length > 0 && (
                            <div className={year2.length > 0 ? "mt-10 md:mt-12" : ""}>
                                <YearBlock title="Year 1" accent="cyan" semesters={year1} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── 15-day streak timeline ──────────────────────────────────────────────────
const STATUS_STYLE: Record<AttendanceDay["status"], { dot: string; ring: string; label: string }> = {
    present: { dot: "bg-emerald-500", ring: "ring-emerald-400/40", label: "Present" },
    partial: { dot: "bg-amber-500", ring: "ring-amber-400/40", label: "Partial" },
    absent: { dot: "bg-red-500", ring: "ring-red-400/40", label: "Absent" },
    holiday: { dot: "bg-slate-700", ring: "ring-slate-600/30", label: "No class" },
    unknown: { dot: "bg-slate-800 border border-dashed border-slate-600", ring: "ring-slate-700/20", label: "No data" },
};

function StreakTimeline({ streak }: { streak: AttendanceStreak }) {
    // Count only real class days — exclude holidays and days we couldn't fetch.
    const marked = streak.days.filter(d => d.status !== "holiday" && d.status !== "unknown");
    const presentCount = marked.filter(d => d.status === "present").length;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <div className="flex items-center justify-between border-b border-emerald-900/30 pb-2 mb-4">
                <h3 className="text-emerald-400 font-mono uppercase tracking-widest text-xs">
                    Last 15 Days
                </h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    {presentCount}/{marked.length} full days
                </span>
            </div>

            <div className="flex items-end gap-1.5 sm:gap-2 overflow-x-auto pb-2">
                {streak.days.map((day, i) => {
                    const s = STATUS_STYLE[day.status];
                    const d = new Date(day.date + "T00:00:00");
                    const dayNum = d.getDate();
                    const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
                    const title =
                        day.status === "holiday"
                            ? `${day.date}: No class`
                            : day.status === "unknown"
                                ? `${day.date}: Data unavailable`
                                : `${day.date}: ${s.label} (${day.present}/${day.total} periods)`;
                    return (
                        <div key={day.date} className="flex flex-col items-center gap-1.5 flex-shrink-0 group" title={title}>
                            <span className="text-[8px] font-mono text-slate-600 uppercase">{weekday}</span>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 20 }}
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${s.dot} ring-2 ${s.ring} group-hover:ring-4 transition-all`}
                            />
                            <span className="text-[9px] font-mono text-slate-500">{dayNum}</span>
                        </div>
                    );
                })}
            </div>

            {/* Legend — show "No data" only if any day actually failed to load. */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {(["present", "partial", "absent", "holiday", "unknown"] as const)
                    .filter(k => k !== "unknown" || streak.days.some(d => d.status === "unknown"))
                    .map(k => (
                        <div key={k} className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLE[k].dot}`} />
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                                {STATUS_STYLE[k].label}
                            </span>
                        </div>
                    ))}
            </div>
        </motion.div>
    );
}

function YearBlock({
    title,
    accent,
    semesters,
}: {
    title: string;
    accent: "cyan" | "amber";
    semesters: AttendanceSemester[];
}) {
    const headClass =
        accent === "amber"
            ? "text-amber-400 border-amber-900/30"
            : "text-cyan-400 border-cyan-900/30";
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <h3 className={`font-mono uppercase tracking-widest mb-4 text-xs border-b pb-2 ${headClass}`}>
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {semesters.map(sem => (
                    <AttendanceCard key={sem.id} sem={sem} />
                ))}
            </div>
        </motion.div>
    );
}

// Attendance below 75% is the standard shortage threshold; flag it red.
function colorFor(percent: number) {
    if (percent >= 85) return { text: "text-emerald-400", bar: "bg-emerald-500", ring: "border-emerald-500" };
    if (percent >= 75) return { text: "text-cyan-400", bar: "bg-cyan-500", ring: "border-cyan-500" };
    if (percent >= 65) return { text: "text-amber-400", bar: "bg-amber-500", ring: "border-amber-500" };
    return { text: "text-red-500", bar: "bg-red-500", ring: "border-red-500" };
}

function AttendanceCard({ sem }: { sem: AttendanceSemester }) {
    const c = colorFor(sem.percent);
    const pct = Math.max(0, Math.min(100, sem.percent));
    return (
        <div className="bg-slate-900/50 border border-slate-800 p-5 md:p-6 rounded-xl md:rounded-2xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className={`w-16 h-16 rounded-full border-4 ${c.ring}`} />
            </div>
            <div className="text-[10px] md:text-xs text-slate-400 font-mono uppercase tracking-widest mb-2">
                {sem.label}
            </div>
            <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-4xl md:text-5xl font-bold font-mono ${c.text}`}>
                    {sem.percent.toFixed(2)}
                </span>
                <span className="text-slate-500 font-mono text-lg">%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                <motion.div
                    className={`h-full ${c.bar} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>{sem.attended}/{sem.held} classes</span>
                <span className="text-slate-600">{sem.from} → {sem.to}</span>
            </div>
        </div>
    );
}
