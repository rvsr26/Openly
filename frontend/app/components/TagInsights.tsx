"use client";

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Tag, BarChart3, ChevronRight, Sparkles, Loader2, Database, Info } from 'lucide-react';
import api from '../lib/api';
import { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
    PieChart, Pie, Legend
} from 'recharts';

const COLORS = ["#7c3aed", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#0ea5e9"];

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

export default function TagInsights() {
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

    const { data: clusters, isLoading: loadingClusters } = useQuery({
        queryKey: ['tagClusters'],
        queryFn: async () => {
            const res = await api.get('/api/v1/ai/data/clusters');
            return res.data;
        }
    });

    const { data: groupedPosts, isLoading: loadingPosts } = useQuery({
        queryKey: ['postsByTheme'],
        queryFn: async () => {
            const res = await api.get('/api/v1/ai/data/posts-by-theme');
            return res.data;
        }
    });

    const themes = clusters?.Themes || {};
    const uncategorized = clusters?.Uncategorized || [];
    const themeNames = Object.keys(themes);

    const chartData = useMemo(() => {
        if (!themeNames.length || !groupedPosts) return [];
        return themeNames.map(theme => ({
            name: theme,
            theme, // For compatibility with different chart components
            posts: groupedPosts[theme]?.length || 0
        })).sort((a, b) => b.posts - a.posts);
    }, [themeNames, groupedPosts]);

    if (loadingClusters || loadingPosts) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">AI Categorizing Platform Data...</p>
            </div>
        );
    }

    // Calculate total posts for percentage
    const totalPosts = themeNames.reduce((acc, t) => acc + (groupedPosts?.[t]?.length || 0), 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-foreground">AI Theme Clusters</h2>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-bold">Posts grouped semantically by Gemini</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Powered by AI Analytics</span>
                </div>
            </div>

            {/* Overall Bar Chart Overview */}
            {chartData.length > 0 && (
                <div className="glass-card p-6 md:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl bg-black/20">
                    <h3 className="text-sm font-black uppercase text-muted-foreground tracking-widest mb-6 border-b border-white/5 pb-2">Platform Content Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="theme" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<GlassTooltip />} cursor={{ fill: '#ffffff05' }} />
                            <Bar dataKey="posts" name="Total Posts" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                {chartData.map((_, i) => (
                                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themeNames.map((theme, idx) => {
                    const postCount = groupedPosts?.[theme]?.length || 0;
                    const tags = themes[theme] || [];
                    const isSelected = selectedTheme === theme;

                    return (
                        <motion.div
                            key={theme || `theme-${idx}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedTheme(isSelected ? null : theme)}
                            className={`p-6 rounded-[2rem] transition-all cursor-pointer group relative overflow-hidden ${isSelected
                                ? 'bg-primary/10 border border-primary/40 shadow-xl shadow-primary/20 scale-[1.02]'
                                : 'bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />}

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-primary/20 text-primary' : 'bg-black/20 text-muted-foreground group-hover:text-primary'}`}>
                                    <Layers size={20} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Posts</p>
                                    <p className={`text-2xl font-black ${isSelected ? 'text-primary' : 'text-foreground'}`}>{postCount}</p>
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-foreground mb-3 relative z-10">{theme}</h3>

                            <div className="flex flex-wrap gap-1.5 mb-6 relative z-10">
                                {tags.slice(0, 4).map((tag: string, tidx: number) => (
                                    <span key={`${theme}-${tag}-${tidx}`} className={`text-[10px] font-bold px-2 py-1 rounded-md ${isSelected ? 'bg-black/40 text-white border border-primary/30' : 'bg-black/20 border border-white/5 text-muted-foreground'}`}>
                                        #{tag}
                                    </span>
                                ))}
                                {tags.length > 4 && (
                                    <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 rounded-md bg-black/10">+{tags.length - 4}</span>
                                )}
                            </div>

                            <div className={`w-full h-1 mt-auto rounded-full overflow-hidden bg-black/20 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(5, (postCount / Math.max(1, totalPosts)) * 100)}%` }} />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* --- DATA VISUALIZATIONS --- */}
            {chartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Bar Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="p-6 rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-2xl shadow-2xl"
                    >
                        <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                            <BarChart3 size={18} className="text-primary" /> Cluster Volume Overview
                        </h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="posts" fill="#ef4444" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="p-6 rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-2xl shadow-2xl"
                    >
                        <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                            <Database size={18} className="text-primary" /> Data Distribution
                        </h3>
                        <div className="h-72 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="posts"
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#888' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Detailed View for Selected Theme */}
            <AnimatePresence>
                {selectedTheme && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: 20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="p-8 rounded-[2.5rem] bg-card border border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden relative"
                    >
                        {/* Background glow */}
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white shadow-lg">
                                <Database size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight">{selectedTheme} Overview</h3>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mt-1">AI Analytical Deep Dive</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                                        <Tag size={14} className="text-primary" /> Associated Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {themes[selectedTheme].map((tag: string, tidx: number) => (
                                            <div key={`${selectedTheme}-${tag}-${tidx}`} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-primary hover:bg-primary/5 transition-all cursor-default text-sm font-bold text-foreground">
                                                <span className="text-primary/50 mr-1">#</span>{tag}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 rounded-[2rem] bg-black/20 border border-white/5">
                                    <div className="flex gap-4">
                                        <Info size={24} className="text-primary shrink-0" />
                                        <div>
                                            <h5 className="font-bold text-sm mb-2 text-foreground">Semantic Grouping</h5>
                                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                                Our AI pipeline groups these specific tags into <strong className="text-white">{selectedTheme}</strong> based on contextual similarity and linguistic patterns observed across the network.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <BarChart3 size={14} className="text-pink-500" /> Theme Dominance
                                </h4>

                                <div className="flex items-center justify-center bg-black/10 rounded-[2rem] border border-white/5 p-4 h-[250px]">
                                    {totalPosts > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: selectedTheme, value: groupedPosts?.[selectedTheme]?.length || 0 },
                                                        { name: 'Other Themes', value: totalPosts - (groupedPosts?.[selectedTheme]?.length || 0) }
                                                    ]}
                                                    cx="50%" cy="50%"
                                                    innerRadius={60} outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    <Cell fill="#7c3aed" />
                                                    <Cell fill="#334155" />
                                                </Pie>
                                                <Tooltip content={<GlassTooltip />} />
                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
