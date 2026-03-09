"use client";

import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Clock, MessageCircle, Heart, UserPlus, Users, FileText, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { InteractionsRadar, DetailedInteractionsBar, OverviewDonut } from '../components/ReportsCharts';

export default function ReportsPage() {
    const { user, loading } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const res = await api.get(`/api/reports/stats?user_id=${user?.uid}`);
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    if (loading || !user) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen text-foreground pb-20">

            <main className="pt-28 max-w-6xl mx-auto px-4 md:px-8">
                <div className="mb-10">
                    <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent inline-block">
                        Your Activity Reports
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg">
                        Insights into your time usage and community interactions.
                    </p>
                </div>

                {isLoadingStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-white/5 rounded-2xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Time Usage Section */}
                        <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Clock className="text-primary" />
                                Time Usage
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass-card p-6 rounded-2xl premium-shadow">
                                    <p className="text-muted-foreground font-medium text-sm uppercase tracking-widest mb-1">Total Time Active</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-foreground">{stats?.time_usage?.total_hours}</span>
                                        <span className="text-lg font-bold text-muted-foreground">Hours</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        ({stats?.time_usage?.total_minutes} minutes)
                                    </p>
                                </div>
                                <div className="glass-card p-6 rounded-2xl premium-shadow flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Activity className="text-green-500" />
                                        <span className="font-bold">Active Tracking</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Time is tracked while you are active on the site.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Interactions Section */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Users className="text-purple-500" />
                                Community Interactions
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass-card p-6 rounded-2xl flex flex-col justify-center min-h-[350px]">
                                    <h3 className="font-bold text-center text-sm uppercase tracking-widest text-muted-foreground border-b border-white/5 pb-2 mb-4">Engagement Balance</h3>
                                    {stats?.interactions ? (
                                        <InteractionsRadar received={stats.interactions.received} made={stats.interactions.made} />
                                    ) : null}
                                </div>
                                
                                <div className="glass-card p-6 rounded-2xl flex flex-col justify-center min-h-[350px]">
                                    <h3 className="font-bold text-center text-sm uppercase tracking-widest text-muted-foreground border-b border-white/5 pb-2 mb-4">Impact Breakdown</h3>
                                    {stats?.interactions ? (
                                        <DetailedInteractionsBar received={stats.interactions.received} made={stats.interactions.made} />
                                    ) : null}
                                </div>
                            </div>
                        </section>

                        {/* Content & Activity Overview */}
                        <section className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
                            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 self-start w-full border-b border-white/5 pb-2">
                                    <FileText className="text-orange-500" />
                                    Content Strategy
                                </h2>
                                <OverviewDonut stats={stats} />
                            </div>

                            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
                                <h3 className="font-bold text-lg border-b border-white/5 pb-2 mb-6">Total Impact Summary</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                                        <p className="text-muted-foreground font-medium text-xs uppercase tracking-widest mb-1">Total Posts Created</p>
                                        <span className="text-4xl font-black text-orange-500">{stats?.posts?.total || 0}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                                        <p className="text-muted-foreground font-medium text-xs uppercase tracking-widest mb-1">Total Likes Given</p>
                                        <span className="text-4xl font-black text-blue-500">{stats?.interactions?.made?.likes || 0}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                                        <p className="text-muted-foreground font-medium text-xs uppercase tracking-widest mb-1">Total Likes Received</p>
                                        <span className="text-4xl font-black text-pink-500">{stats?.interactions?.received?.likes || 0}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                                        <p className="text-muted-foreground font-medium text-xs uppercase tracking-widest mb-1">Followers Gained</p>
                                        <span className="text-4xl font-black text-green-500">{stats?.interactions?.received?.followers || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
