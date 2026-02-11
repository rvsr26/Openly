"use client";

import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Clock, MessageCircle, Heart, UserPlus, Users, FileText, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

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
                        <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Users className="text-purple-500" />
                                Community Interactions
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* RECEIVED */}
                                <div className="glass-card p-6 rounded-2xl space-y-4">
                                    <h3 className="font-bold text-lg border-b border-white/5 pb-2">Recieved (Impact)</h3>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Heart className="text-pink-500" size={20} />
                                            <span className="font-medium">Likes Received</span>
                                        </div>
                                        <span className="text-xl font-black">{stats?.interactions?.received?.likes}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <MessageCircle className="text-blue-500" size={20} />
                                            <span className="font-medium">Comments Received</span>
                                        </div>
                                        <span className="text-xl font-black">{stats?.interactions?.received?.comments}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <UserPlus className="text-green-500" size={20} />
                                            <span className="font-medium">New Followers</span>
                                        </div>
                                        <span className="text-xl font-black">{stats?.interactions?.received?.followers}</span>
                                    </div>
                                </div>

                                {/* MADE */}
                                <div className="glass-card p-6 rounded-2xl space-y-4">
                                    <h3 className="font-bold text-lg border-b border-white/5 pb-2">Made (Engagement)</h3>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Heart className="text-muted-foreground" size={20} />
                                            <span className="font-medium">Likes Given</span>
                                        </div>
                                        <span className="text-xl font-black">{stats?.interactions?.made?.likes}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <MessageCircle className="text-muted-foreground" size={20} />
                                            <span className="font-medium">Comments Posted</span>
                                        </div>
                                        <span className="text-xl font-black">{stats?.interactions?.made?.comments}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <UserPlus className="text-muted-foreground" size={20} />
                                            <span className="font-medium">People Followed</span>
                                        </div>
                                        <span className="text-xl font-black">{stats?.interactions?.made?.following}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Posts Section */}
                        <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <FileText className="text-orange-500" />
                                Content Creation
                            </h2>
                            <div className="glass-card p-6 rounded-2xl premium-shadow flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground font-medium text-sm uppercase tracking-widest">Total Posts Created</p>
                                    <p className="text-xs text-muted-foreground mt-1">Your contributions to the community.</p>
                                </div>
                                <span className="text-5xl font-black text-foreground">{stats?.posts?.total}</span>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
