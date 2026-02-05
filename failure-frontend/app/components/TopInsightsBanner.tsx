"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, ArrowRight } from "lucide-react";
import { memo } from "react";

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

                {/* Right Visuals (Mock Graphs) */}
                <div className="hidden md:flex justify-end gap-5">

                    {/* Card 1: Line Chart */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                        className="w-44 h-36 glass-card !bg-background/40 p-5 flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                <TrendingUp size={16} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500">+24%</span>
                        </div>
                        <div>
                            <div className="flex items-end gap-1.5 h-10 mt-2 justify-between px-1">
                                <div className="w-2 bg-primary/20 h-4 rounded-t-sm"></div>
                                <div className="w-2 bg-primary/40 h-6 rounded-t-sm"></div>
                                <div className="w-2 bg-primary/30 h-5 rounded-t-sm"></div>
                                <div className="w-2 bg-primary/60 h-8 rounded-t-sm"></div>
                                <div className="w-2 bg-primary h-7 rounded-t-sm"></div>
                            </div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-2 px-1">Activity</p>
                        </div>
                    </motion.div>

                    {/* Card 2: Donut/Stats */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.2 }}
                        className="w-44 h-36 glass-card !bg-background/40 p-5 flex flex-col justify-between translate-y-8"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                                <BarChart3 size={16} />
                            </div>
                            <ArrowRight size={14} className="text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                <span>Reviews</span>
                                <span className="text-foreground">854</span>
                            </div>
                            <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden">
                                <div className="bg-purple-400 w-[70%] h-full"></div>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground uppercase tracking-wider pt-0.5">
                                <span>Views</span>
                                <span className="text-foreground">3.2k</span>
                            </div>
                            <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden">
                                <div className="bg-primary w-[45%] h-full"></div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}

export default memo(TopInsightsBanner);
