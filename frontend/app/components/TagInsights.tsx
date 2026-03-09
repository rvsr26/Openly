"use client";

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Layers, Tag, BarChart3, ChevronRight, Sparkles, Loader2, Database, Info } from 'lucide-react';
import api from '../lib/api';
import { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

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
            posts: groupedPosts[theme]?.length || 0
        })).sort((a, b) => b.posts - a.posts); // Sort by highest count
    }, [themeNames, groupedPosts]);

    if (loadingClusters || loadingPosts) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">AI Categorizing Platform Data...</p>
            </div>
        );
    }

    const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-foreground">AI Data Separation</h2>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-bold">Posts grouped by AI-generated themes</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase">Gemini powered</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themeNames.map((theme, idx) => {
                    const postCount = groupedPosts?.[theme]?.length || 0;
                    const tags = themes[theme] || [];

                    return (
                        <motion.div
                            key={theme || `theme-${idx}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => setSelectedTheme(theme === selectedTheme ? null : theme)}
                            className={`p-6 rounded-3xl border transition-all cursor-pointer group ${selectedTheme === theme
                                ? 'bg-primary/5 border-primary/30 shadow-xl shadow-primary/5'
                                : 'bg-white/3 border-white/5 hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-primary/10 transition-colors">
                                    <Layers size={20} className={selectedTheme === theme ? 'text-primary' : 'text-muted-foreground'} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Post Count</p>
                                    <p className="text-lg font-black text-foreground">{postCount}</p>
                                </div>
                            </div>

                            <h3 className="text-md font-black text-foreground mb-3">{theme}</h3>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {tags.slice(0, 5).map((tag: string, tidx: number) => (
                                    <span key={`${theme}-${tag}-${tidx}`} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-muted-foreground">
                                        #{tag}
                                    </span>
                                ))}
                                {tags.length > 5 && (
                                    <span className="text-[9px] font-bold text-muted-foreground/50">+{tags.length - 5} more</span>
                                )}
                            </div>

                            <button className="w-full py-2 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center gap-2">
                                {selectedTheme === theme ? 'Collapse Data' : 'View Separation Details'}
                                <ChevronRight size={12} className={selectedTheme === theme ? 'rotate-90' : ''} />
                            </button>
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
            {selectedTheme && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-8 rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-2xl"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white">
                            <Database size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{selectedTheme} Cluster</h3>
                            <p className="text-sm text-muted-foreground">Separated data insights for this theme</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Tag size={12} /> Key Tags in This Cluster
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {themes[selectedTheme].map((tag: string, tidx: number) => (
                                    <div key={`${selectedTheme}-${tag}-${tidx}`} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-default group/tag">
                                        <span className="text-xs font-bold text-foreground group-hover/tag:text-primary">#{tag}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                <BarChart3 size={12} /> Cluster Composition
                            </h4>
                            <div className="p-6 rounded-3xl bg-white/3 border border-white/5">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    AI has identified these posts as being highly relevant to <span className="text-white font-bold">{selectedTheme}</span>.
                                    This cluster represents {Math.round(((groupedPosts?.[selectedTheme]?.length || 0) / themeNames.reduce((acc, t) => acc + (groupedPosts?.[t]?.length || 0), 0)) * 100)}%
                                    of categorized platform content.
                                </p>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-amber-500/80 leading-normal">
                                    Separation is based on semantic proximity of tags and post content mapped by Gemini AI.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
