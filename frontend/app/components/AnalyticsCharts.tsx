"use client";

import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    BarChart, Bar, Legend
} from "recharts";

// ── COLOUR PALETTE ────────────────────────────────────────────
const COLORS = ["#7c3aed", "#a855f7", "#c084fc", "#e879f9", "#38bdf8", "#34d399", "#fbbf24", "#f87171"];
const SENTIMENT_COLORS: Record<string, string> = {
    POSITIVE: "#34d399",
    NEGATIVE: "#f87171",
    NEUTRAL:  "#94a3b8",
};

// ── CUSTOM TOOLTIP ────────────────────────────────────────────
const GlassTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="px-4 py-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 text-xs font-bold shadow-xl">
            {label && <p className="text-muted-foreground mb-1">{label}</p>}
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color || p.fill }}>
                    {p.name}: <span className="text-white">{p.value}</span>
                </p>
            ))}
        </div>
    );
};

// ── PIE / DONUT CHART ─────────────────────────────────────────
interface PieDataItem { name: string; value: number; }
export function DonutChart({ data }: { data: PieDataItem[] }) {
    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
            </PieChart>
        </ResponsiveContainer>
    );
}

// ── SENTIMENT PIE ─────────────────────────────────────────────
interface SentimentItem { sentiment: string; count: number; }
export function SentimentPie({ data }: { data: SentimentItem[] }) {
    const mapped = data.map(d => ({ name: d.sentiment, value: d.count }));
    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={mapped}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                >
                    {mapped.map((entry, i) => (
                        <Cell key={i} fill={SENTIMENT_COLORS[entry.name] ?? COLORS[i % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-[11px] font-bold text-muted-foreground">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

// ── AREA / LINE CHART ─────────────────────────────────────────
interface TrendItem { date: string; posts: number; }
export function PostTrendArea({ data }: { data: TrendItem[] }) {
    return (
        <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="postGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<GlassTooltip />} />
                <Area
                    type="monotone" dataKey="posts" name="Posts"
                    stroke="#7c3aed" strokeWidth={2}
                    fill="url(#postGrad)"
                    dot={false} activeDot={{ r: 4, fill: "#7c3aed" }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ── HORIZONTAL BAR CHART ──────────────────────────────────────
interface BarItem { topic: string; posts_count: number; }
export function TrendingBar({ data }: { data: BarItem[] }) {
    return (
        <ResponsiveContainer width="100%" height={Math.max(240, data.length * 36)}>
            <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis
                    type="category" dataKey="topic"
                    tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
                    tickLine={false} axisLine={false}
                    width={90}
                />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="posts_count" name="Posts" radius={[0, 8, 8, 0]} maxBarSize={24}>
                    {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

// ── TOP POSTS BAR ─────────────────────────────────────────────
interface TopPost { label: string; reactions: number; category: string; }
export function TopPostsBar({ data }: { data: TopPost[] }) {
    return (
        <ResponsiveContainer width="100%" height={Math.max(240, data.length * 40)}>
            <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis
                    type="category" dataKey="label"
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    tickLine={false} axisLine={false}
                    width={110}
                />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="reactions" name="Reactions" radius={[0, 8, 8, 0]} fill="#a855f7" maxBarSize={22} />
            </BarChart>
        </ResponsiveContainer>
    );
}
