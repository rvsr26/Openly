"use client";

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Layers, Tag, BarChart3, ChevronRight, Sparkles, Loader2, Database, Info } from 'lucide-react';
import api from '../lib/api';
import { useState } from 'react';

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

    if (loadingClusters || loadingPosts) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">AI Categorizing Platform Data...</p>
            </div>
        );
    }

    const themes = clusters?.Themes || {};
    const uncategorized = clusters?.Uncategorized || [];
    const themeNames = Object.keys(themes);

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
                    const tags = themes[theme];

                    return (
                        <motion.div
                            key={theme}
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
                                {tags.slice(0, 5).map((tag: string) => (
                                    <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-muted-foreground">
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
                                {themes[selectedTheme].map((tag: string) => (
                                    <div key={tag} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-default group/tag">
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
