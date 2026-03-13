"use client";

import { useRef } from 'react';
import { ArrowRight, Users, TrendingUp, Shield, Zap, Heart, Star, Flame, Lock, Globe, ChevronDown, Activity, PieChart, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import {
    DonutChart,
    PostTrendArea,
    TrendingBar,
    SentimentPie
} from "../components/AnalyticsCharts";

const features = [
    { icon: Lock, title: 'Share Anonymously', description: 'Use ghost aliases to share your real story without fear of judgment.', color: 'from-violet-500 to-purple-600' },
    { icon: TrendingUp, title: 'Learn & Grow', description: 'Turn failures into lessons. Every stumble is a step forward.', color: 'from-blue-500 to-cyan-500' },
    { icon: Shield, title: 'Safe Community', description: 'AI moderation keeps the space supportive and judgment-free.', color: 'from-emerald-500 to-teal-500' },
    { icon: Zap, title: 'Phoenix Score', description: 'Earn karma points by sharing and helping. Rise like a Phoenix.', color: 'from-amber-500 to-orange-500' },
];

const stats = [
    { number: '10K+', label: 'Stories Shared' },
    { number: '50K+', label: 'Community Members' },
    { number: '95%', label: 'Feel Supported' },
    { number: '4.9', label: 'User Rating' },
];

const testimonials = [
    { name: 'Sarah Chen', role: 'Startup Founder', content: 'Sharing my startup failure here helped me process it and move forward. The community support was incredible.', avatar: 'SC' },
    { name: 'Michael R.', role: 'Software Engineer', content: 'I learned more from reading others\' failures than from any success story. This platform is a goldmine.', avatar: 'MR' },
    { name: 'Emily Watson', role: 'Product Manager', content: 'The anonymous feature gave me the courage to share. Now I help others avoid the same mistakes.', avatar: 'EW' },
];

const steps = [
    { step: '01', title: 'Create Account', desc: 'Sign up in seconds. Choose to share openly or as a ghost.' },
    { step: '02', title: 'Share Your Story', desc: 'Write about your failure honestly. Be real, be vulnerable.' },
    { step: '03', title: 'Learn & Connect', desc: 'Read others\' stories, offer support, and grow together.' },
];

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Syncing Pulse...</p>
        </div>
    );
}

export default function LandingPage() {
    const router = useRouter();
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    // ── DATA FETCHES ────────────────────────────────────────────
    const { data: categories = [], isLoading: loadCats } = useQuery({
        queryKey: ["landingCategories"],
        queryFn: async () => { const r = await api.get("/stats/categories"); return r.data; },
        staleTime: 1000 * 60 * 10,
    });

    const { data: trend = [], isLoading: loadTrend } = useQuery({
        queryKey: ["landingTrend"],
        queryFn: async () => { const r = await api.get("/stats/post-trend"); return r.data; },
        staleTime: 1000 * 60 * 10,
    });

    const { data: sentiment = [], isLoading: loadSent } = useQuery({
        queryKey: ["landingSentiment"],
        queryFn: async () => { const r = await api.get("/stats/sentiment-summary"); return r.data; },
        staleTime: 1000 * 60 * 10,
    });

    const { data: trending = [], isLoading: loadTrending } = useQuery({
        queryKey: ["landingTrending"],
        queryFn: async () => { const r = await api.get("/stats/trending"); return r.data ?? []; },
        staleTime: 1000 * 60 * 10,
    });

    const totalPosts = categories.reduce((s: number, c: any) => s + c.count, 0);
    const positiveSent = sentiment.find((s: any) => s.sentiment === "POSITIVE")?.count ?? 0;
    const totalSent = sentiment.reduce((s: number, c: any) => s + c.count, 0);
    const positiveRate = totalSent > 0 ? Math.round((positiveSent / totalSent) * 100) : 0;
    const categoryPie = categories.map((c: any) => ({ name: c.category, value: c.count }));

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">

            {/* ── NAVBAR ─────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                            <Flame className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-black text-foreground tracking-tight">Openly</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/login')} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Sign In
                        </button>
                        <button onClick={() => router.push('/signup')} className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105">
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ───────────────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px]" />
                </div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />

                <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-24">
                    {/* Badge */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8">
                        <Flame className="w-4 h-4" />
                        <span>Join 50K+ brave souls</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-7xl lg:text-8xl font-black text-foreground tracking-tight leading-[0.9] mb-6">
                        Turn Your<br />
                        <span className="bg-gradient-to-r from-primary via-violet-400 to-blue-400 bg-clip-text text-transparent">
                            Failures
                        </span>
                        <br />Into Lessons
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        A brave community where failures are celebrated as stepping stones.
                        Share anonymously, learn from others, and rise like a Phoenix.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <button onClick={() => router.push('/signup')}
                            className="group flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold text-base rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105">
                            Start Sharing Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={() => router.push('/login')}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-foreground font-bold text-base rounded-2xl hover:bg-white/10 transition-all">
                            Explore Stories
                        </button>
                    </motion.div>

                    {/* Stats/Analytics Preview */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="text-3xl font-black text-primary mb-1">{totalPosts > 0 ? `${(totalPosts / 1000).toFixed(1)}K+` : '10K+'}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stories Shared</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="text-3xl font-black text-violet-400 mb-1">{loadTrending ? '...' : `${trending.length}`}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Hubs</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="text-3xl font-black text-emerald-400 mb-1">{positiveRate > 0 ? `${positiveRate}%` : '95%'}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Positive Support</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="text-3xl font-black text-amber-400 mb-1">4.9</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">User Safety</div>
                        </div>
                    </motion.div>

                    {/* Scroll hint */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                        className="mt-16 flex flex-col items-center gap-2 text-muted-foreground/50">
                        <span className="text-xs font-medium uppercase tracking-widest">Scroll to explore</span>
                        <ChevronDown className="w-4 h-4 animate-bounce" />
                    </motion.div>
                </motion.div>
            </section>

            {/* ── PLATFORM ANALYTICS ─────────────────────────── */}
            <section className="py-32 px-6 relative bg-white/[0.02]">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                            <Activity className="w-3 h-3" /> Platform Pulse
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">Real-Time Impact</h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            We believe in radical transparency. See how our community grows and supports each other in real-time.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Post Trend Area */}
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                            className="p-8 rounded-[2rem] bg-white/3 border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                                    <TrendingUp className="text-primary w-5 h-5" />
                                </div>
                                <h3 className="font-black text-lg tracking-tight">Post Activity — 30 Days</h3>
                            </div>
                            <div className="h-[300px] w-full">
                                {loadTrend ? <LoadingState /> : <PostTrendArea data={trend} />}
                            </div>
                        </motion.div>

                        {/* Category Distribution */}
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                            className="p-8 rounded-[2rem] bg-white/3 border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                                    <PieChart className="text-violet-400 w-5 h-5" />
                                </div>
                                <h3 className="font-black text-lg tracking-tight">Category Distribution</h3>
                            </div>
                            <div className="h-[300px] w-full">
                                {loadCats ? <LoadingState /> : <DonutChart data={categoryPie} />}
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        {/* Sentiment Highlights */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="p-8 rounded-[2rem] bg-white/3 border border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles className="text-emerald-400 w-5 h-5" />
                                <h3 className="font-bold text-base">Supportive Sentiment</h3>
                            </div>
                            <div className="h-[240px]">
                                {loadSent ? <LoadingState /> : <SentimentPie data={sentiment} />}
                            </div>
                        </motion.div>

                        {/* Trending Bar */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="p-8 rounded-[2rem] bg-white/3 border border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <Flame className="text-orange-500 w-5 h-5" />
                                <h3 className="font-bold text-base">Top Trending Topics</h3>
                            </div>
                            <div className="h-[240px] overflow-hidden">
                                {loadTrending ? <LoadingState /> : <TrendingBar data={trending.slice(0, 5)} />}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ───────────────────────────────────── */}
            <section className="py-32 px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-4">
                            Why Openly
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">Built for Brave Souls</h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Every feature designed to make vulnerability safe and growth inevitable.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                                    className="group p-6 rounded-3xl bg-white/3 border border-white/10 hover:border-white/15 hover:bg-white/6 transition-all duration-300 hover:-translate-y-1">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-black text-foreground mb-2">{f.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ───────────────────────────────── */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-4">
                            How It Works
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4">Three Simple Steps</h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connector line */}
                        <div className="hidden md:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        {steps.map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                                className="relative text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 text-primary font-black text-xl">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-black text-foreground mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ───────────────────────────────── */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-4">
                            Community Love
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">What They're Saying</h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                                className="p-6 rounded-3xl bg-white/3 border border-white/8 hover:border-white/15 transition-all duration-300">
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-foreground/80 text-sm leading-relaxed mb-6 italic">"{t.content}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-black">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <div className="font-black text-sm text-foreground">{t.name}</div>
                                        <div className="text-xs text-muted-foreground">{t.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────────── */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                        className="relative p-12 md:p-16 rounded-[2.5rem] overflow-hidden text-center border border-white/10 bg-gradient-to-br from-primary/15 via-violet-500/10 to-blue-500/5">
                        {/* Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet-500/10 blur-3xl -z-10" />
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm font-semibold mb-6">
                            <Heart className="w-4 h-4 text-red-400" />
                            <span>Join the movement</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
                            Ready to Rise?
                        </h2>
                        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
                            Thousands are already turning their failures into fuel. Your story matters — share it today.
                        </p>
                        <button onClick={() => router.push('/signup')}
                            className="group inline-flex items-center gap-2 px-10 py-4 bg-primary text-white font-black text-base rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/40 hover:scale-105 hover:shadow-primary/60">
                            Get Started Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────────────── */}
            <footer className="py-12 px-6 border-t border-white/8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
                            <Flame className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-black text-foreground">Openly</span>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Features</a>
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        <a href="#" className="hover:text-foreground transition-colors">About</a>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        © 2025 Openly. Built with ❤️ for the brave.
                    </div>
                </div>
            </footer>
        </div>
    );
}
