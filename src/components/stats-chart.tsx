"use client";

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { StudentResult } from "@/types";

interface StatsChartProps {
    data: StudentResult[];
}

export default function StatsChart({ data }: StatsChartProps) {
    // Transform data for the chart
    // Filter out subjects with 0 credits or empty grades if they are not relevant?
    // User payload has "INDIAN KNOWLEDGE SYSTEM" with 0 credits and grade null, but marks present.
    // We want to show marks. Convert "total" string to number.
    // Handle "null" or empty strings.

    const chartData = data
        .filter((item) => item.total && !isNaN(Number(item.total)))
        .map((item) => ({
            subject: item.course.replace(/\(.*\)/, "").substring(0, 15) + "...", // Truncate long names
            fullSubject: item.course,
            marks: Number(item.total),
            grade: item.grade,
        }));

    return (
        <div className="w-full h-full min-h-[400px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <defs>
                        <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.2} />
                        </linearGradient>
                    </defs>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#94a3b8", fontSize: 12, className: "font-mono" }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Marks"
                        dataKey="marks"
                        stroke="#22d3ee"
                        strokeWidth={3}
                        fill="url(#radarFill)"
                        fillOpacity={0.6}
                        isAnimationActive={true}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs font-mono">
                                        <div className="text-cyan-400 font-bold mb-1">{data.fullSubject}</div>
                                        <div className="text-white">Marks: <span className="text-cyan-300">{data.marks}</span></div>
                                        <div className="text-slate-400">Grade: {data.grade || "N/A"}</div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
