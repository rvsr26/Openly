"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { motion } from "framer-motion";
import {
    BarChart3, TrendingUp, PieChart, Activity,
    Flame, Loader2, Sparkles, AlertCircle
} from "lucide-react";
import {
    DonutChart,
    PostTrendArea,
    TrendingBar,
    SentimentPie,
    TopPostsBar
} from "../components/AnalyticsCharts";
import LeftSidebar from "../components/LeftSidebar";
import { useAuth } from "@/context/AuthContext";
import { useQuery as useProfileQuery } from "@tanstack/react-query";

// ── STAT CARD ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 flex items-center gap-4"
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
            <div>
                <p className="text-2xl font-black text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{label}</p>
            </div>
        </motion.div>
    );
}

// ── CHART CARD ─────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, children, delay = 0 }: { title: string; icon: any; children: React.ReactNode; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="glass-card p-6"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Icon size={16} className="text-primary" />
                </div>
                <h2 className="text-sm font-black text-foreground uppercase tracking-wider">{title}</h2>
            </div>
            {children}
        </motion.div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Loading analytics...</p>
        </div>
    );
}

function ErrorState({ msg }: { msg: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm font-bold">{msg}</p>
        </div>
    );
}

export default function AnalyticsPage() {
    const { user } = useAuth();

    const { data: profile } = useProfileQuery({
        queryKey: ["userProfile", user?.uid],
        queryFn: async () => {
            if (!user) return null;
            const res = await api.get(`/users/${user.uid}/profile`);
            return res.data;
        },
        enabled: !!user,
    });

    const username  = profile?.user_info?.username || "";
    const userPhoto = profile?.user_info?.photoURL || user?.photoURL || "";

    // ── DATA FETCHES ────────────────────────────────────────────
    const { data: categories = [], isLoading: loadCats, isError: errCats } = useQuery({
        queryKey: ["statCategories"],
        queryFn: async () => { const r = await api.get("/stats/categories"); return r.data; },
        staleTime: 1000 * 60 * 5,
    });

    const { data: trend = [], isLoading: loadTrend } = useQuery({
        queryKey: ["statTrend"],
        queryFn: async () => { const r = await api.get("/stats/post-trend"); return r.data; },
        staleTime: 1000 * 60 * 5,
    });

    const { data: sentiment = [], isLoading: loadSent } = useQuery({
        queryKey: ["statSentiment"],
        queryFn: async () => { const r = await api.get("/stats/sentiment-summary"); return r.data; },
        staleTime: 1000 * 60 * 5,
    });

    const { data: topPosts = [], isLoading: loadTop } = useQuery({
        queryKey: ["statTopPosts"],
        queryFn: async () => { const r = await api.get("/stats/top-posts"); return r.data; },
        staleTime: 1000 * 60 * 5,
    });

    const { data: trending = [], isLoading: loadTrending } = useQuery({
        queryKey: ["trending"],
        queryFn: async () => { const r = await api.get("/stats/trending"); return r.data ?? []; },
        staleTime: 1000 * 60 * 5,
    });

    // ── COMPUTED SUMMARY STATS ──────────────────────────────────
    const totalPosts    = categories.reduce((s: number, c: any) => s + c.count, 0);
    const totalTrending = trending.length;
    const positiveSent  = sentiment.find((s: any) => s.sentiment === "POSITIVE")?.count ?? 0;
    const totalSent     = sentiment.reduce((s: number, c: any) => s + c.count, 0);
    const positiveRate  = totalSent > 0 ? Math.round((positiveSent / totalSent) * 100) : 0;
    const peakDay       = trend.length > 0
        ? trend.reduce((a: any, b: any) => (a.posts >= b.posts ? a : b))
        : null;

    // ── CATEGORY DATA FOR DONUT ─────────────────────────────────
    const categoryPie = categories.map((c: any) => ({ name: c.category, value: c.count }));

    return (
        <div className="min-h-screen">
            <main className="relative z-10 pt-28 pb-24 max-w-[1400px] mx-auto px-6 xl:px-10">
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">

                    {/* LEFT SIDEBAR */}
                    <aside className="hidden lg:flex flex-col sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto scrollbar-hide">
                        <LeftSidebar user={user} username={username} userPhoto={userPhoto} />
                    </aside>

                    {/* MAIN CONTENT */}
                    <div className="flex flex-col gap-8">

                        {/* PAGE HEADER */}
                        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30">
                                <BarChart3 size={22} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-foreground tracking-tight">Platform Analytics</h1>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Sparkles size={10} className="text-primary" /> Live data from Openly
                                </p>
                            </div>
                        </motion.div>

                        {/* SUMMARY STAT CARDS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard icon={BarChart3} label="Total Posts"    value={totalPosts}         color="bg-primary" />
                            <StatCard icon={Flame}     label="Trending Topics" value={totalTrending}      color="bg-orange-500" />
                            <StatCard icon={TrendingUp} label="Positive Rate"  value={`${positiveRate}%`} color="bg-emerald-600" />
                            <StatCard icon={Activity}  label="Peak Day Posts"  value={peakDay?.posts ?? 0} color="bg-purple-600" />
                        </div>

                        {/* ROW 1: Post Trend (wide) + Category Donut */}
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
                            <ChartCard title="Post Activity — Last 30 Days" icon={Activity} delay={0.1}>
                                {loadTrend ? <LoadingState /> : trend.length === 0
                                    ? <ErrorState msg="No trend data yet" />
                                    : <PostTrendArea data={trend} />
                                }
                            </ChartCard>
                            <ChartCard title="Category Distribution" icon={PieChart} delay={0.15}>
                                {loadCats ? <LoadingState /> : errCats
                                    ? <ErrorState msg="Could not load categories" />
                                    : categoryPie.length === 0
                                        ? <ErrorState msg="No category data yet" />
                                        : <DonutChart data={categoryPie} />
                                }
                            </ChartCard>
                        </div>

                        {/* ROW 2: Trending Topics + Sentiment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ChartCard title="Top Trending Topics" icon={Flame} delay={0.2}>
                                {loadTrending ? <LoadingState /> : trending.length === 0
                                    ? <ErrorState msg="No trending data yet" />
                                    : <TrendingBar data={trending.slice(0, 10)} />
                                }
                            </ChartCard>
                            <ChartCard title="Sentiment Breakdown" icon={Sparkles} delay={0.25}>
                                {loadSent ? <LoadingState /> : sentiment.length === 0
                                    ? <ErrorState msg="No sentiment data yet" />
                                    : <SentimentPie data={sentiment} />
                                }
                            </ChartCard>
                        </div>

                        {/* ROW 3: Top Reacted Posts (full width) */}
                        <ChartCard title="🏆 Top Reacted Posts" icon={TrendingUp} delay={0.3}>
                            {loadTop ? <LoadingState /> : topPosts.length === 0
                                ? <ErrorState msg="No reaction data yet. Be the first to react!" />
                                : <TopPostsBar data={topPosts} />
                            }
                        </ChartCard>

                    </div>
                </div>
            </main>
        </div>
    );
}
