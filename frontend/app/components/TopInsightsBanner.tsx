"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, ArrowRight } from "lucide-react";
import { memo } from "react";

import Link from "next/link"; // [NEW] Import Link

function TopInsightsBanner() {
    return (
        <div className="w-full relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-card via-background to-primary/5 border border-border/50 premium-shadow mb-8 min-h-[220px] flex items-center group/banner">

            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover/banner:scale-110 transition-transform duration-1000"></div>
            <div className="absolute bottom-0 left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2"></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-10 w-full items-center">

                {/* Left Text */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Insights</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-[1.1]">
                        Top Insights <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Of The Week</span>
                    </h1>

                    <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm">
                        Discover the most impactful reviews and suggestions trending in your network right now.
                    </p>

                    <div className="flex gap-2 pt-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/20"></span>
                        <span className="h-1.5 w-8 rounded-full bg-primary shadow-sm shadow-primary/40"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/20"></span>
                    </div>
                </div>

                {/* Right Visuals (Trending Hashtags) */}
                <div className="hidden md:flex flex-col items-end gap-3 z-10">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Trending Topics</p>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 max-w-sm">
                        {['#Startup', '#Failure', '#Growth', '#Career', '#LifeLesson'].map((tag, i) => (
                            <Link
                                key={tag}
                                href={`/search?q=${encodeURIComponent(tag.replace('#', ''))}`} // Search for the tag content
                                className="px-4 py-2 bg-background/50 hover:bg-primary hover:text-white border border-border/50 rounded-full text-xs font-bold transition-all duration-300 shadow-sm hover:shadow-primary/25 backdrop-blur-sm"
                            >
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * i }}
                                >
                                    {tag}
                                </motion.span>
                            </Link>
                        ))}
                    </div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="glass-card !bg-background/40 py-2 px-4 flex items-center gap-3 backdrop-blur-md mt-2"
                    >
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                            <TrendingUp size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground font-semibold">Weekly Growth</p>
                            <p className="text-sm font-black text-foreground">+540 <span className="text-[10px] text-emerald-500 font-bold">New Stories</span></p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default memo(TopInsightsBanner);
