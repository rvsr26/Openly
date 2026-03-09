"use client";

import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const COLORS = ["#7c3aed", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"];

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

export function InteractionsRadar({ received, made }: { received: any, made: any }) {
    const data = [
        {
            subject: 'Likes',
            A: received.likes || 0,
            B: made.likes || 0,
            fullMark: Math.max(received.likes, made.likes, 10)
        },
        {
            subject: 'Comments',
            A: received.comments || 0,
            B: made.comments || 0,
            fullMark: Math.max(received.comments, made.comments, 10)
        },
        {
            subject: 'Connections',
            A: received.followers || 0,
            B: made.following || 0,
            fullMark: Math.max(received.followers, made.following, 10)
        }
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }} />
                <Radar name="Received / Impact" dataKey="A" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} />
                <Radar name="Made / Engagement" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
            </RadarChart>
        </ResponsiveContainer>
    );
}

export function DetailedInteractionsBar({ received, made }: { received: any, made: any }) {
    const data = [
        { name: 'Likes', Received: received.likes || 0, Made: made.likes || 0 },
        { name: 'Comments', Received: received.comments || 0, Made: made.comments || 0 },
        { name: 'Connections', Received: received.followers || 0, Made: made.following || 0 },
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: '#ffffff10' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                <Bar dataKey="Received" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Made" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function OverviewDonut({ stats }: { stats: any }) {
    const data = [
        { name: 'Posts', value: stats?.posts?.total || 0 },
        { name: 'Likes Given', value: stats?.interactions?.made?.likes || 0 },
        { name: 'Comments Made', value: stats?.interactions?.made?.comments || 0 },
    ].filter(d => d.value > 0);

    if (data.length === 0) {
        return <div className="h-[280px] flex items-center justify-center text-muted-foreground font-bold">No Activity Yet</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
            </PieChart>
        </ResponsiveContainer>
    );
}
