"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { TrendingUp, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { User } from "firebase/auth";
import CreatePost from "./CreatePost";
import { memo } from "react";

interface TrendingTopic {
    topic: string;
    posts_count: number;
}

interface RightSidebarProps {
    user: User | null;
    userPhoto?: string;
    content: string;
    setContent: (val: string) => void;
    isAnonymous: boolean;
    setIsAnonymous: (val: boolean) => void;
    handleSubmit: () => void;
    handleSaveDraft: () => void;
    loading: boolean;
    imageUrl: string;
    setImageUrl: (val: string) => void;
}

function RightSidebar({
    user,
    userPhoto,
    content,
    setContent,
    isAnonymous,
    setIsAnonymous,
    handleSubmit,
    handleSaveDraft,
    loading,
    imageUrl,
    setImageUrl
}: RightSidebarProps) {

    const { data: trending = [], isLoading } = useQuery<TrendingTopic[]>({
        queryKey: ["trending"],
        queryFn: async () => {
            const res = await api.get("/stats/trending");
            return res.data;
        },
        staleTime: 1000 * 60 * 5 // 5 mins
    });

    // Mock Data for Recommendations
    const recommendedUsers = [
        { name: "Jenny Svortin", impact: "High", pic: "/assets/avatar1.png" },
        { name: "Jenue Keretla", impact: "Medium", pic: "/assets/avatar2.png" },
        { name: "Saniitu", impact: "High", pic: "/assets/avatar3.png" },
        { name: "Soncy Manso", impact: "Rising", pic: "/assets/avatar4.png" },
    ];

    return (
        <div className="w-full space-y-6">



            {/* CREATE POST FORM (Visible if user is logged in) */}
            <CreatePost
                user={user}
                userPhoto={userPhoto}
                content={content}
                setContent={setContent}
                isAnonymous={isAnonymous}
                setIsAnonymous={setIsAnonymous}
                handleSubmit={handleSubmit}
                handleSaveDraft={handleSaveDraft}
                loading={loading}
                imageUrl={imageUrl}
                setImageUrl={setImageUrl}
            />


            {/* 2. TRENDING TOPICS */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Trending</h3>
                    <TrendingUp size={16} className="text-primary" />
                </div>

                {/* GRAPH VISUALIZATION (Mock SVG) */}
                <div className="h-24 w-full relative mb-6">
                    <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0,35 Q10,35 20,20 T40,25 T60,5 T80,15 T100,5" fill="none" stroke="#6366f1" strokeWidth="2" />
                        <path d="M0,35 Q10,35 20,20 T40,25 T60,5 T80,15 T100,5 V40 H0 Z" fill="url(#gradient)" stroke="none" />
                        <circle cx="60" cy="5" r="2" fill="white" className="animate-pulse" />
                    </svg>

                    {/* Months Label */}
                    <div className="flex justify-between text-[8px] font-bold text-muted-foreground/40 mt-2 uppercase tracking-widest">
                        <span>Jan</span>
                        <span>Mar</span>
                        <span>May</span>
                        <span>Jul</span>
                        <span>Aug</span>
                        <span>Sep</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {isLoading ? (
                        <div className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">Loading trends...</div>
                    ) : (trending || []).length > 0 ? (
                        trending.map((t) => (
                            <Link key={t.topic} href={`/?category=${t.topic}`} className="px-3 py-1.5 rounded-xl bg-white/5 border border-border/50 hover:bg-primary/5 hover:border-primary/30 text-[10px] font-bold text-foreground transition-all">
                                #{t.topic}
                            </Link>
                        ))
                    ) : (
                        ["tech", "career", "startups", "life", "coding"].map(tag => (
                            <span key={tag} className="px-3 py-1.5 rounded-xl bg-white/5 border border-border/50 text-[10px] font-bold text-muted-foreground">
                                #{tag}
                            </span>
                        ))
                    )}
                </div>
            </div>

            {/* 3. RECOMMENDED USERS */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-widest">Top Insight</h3>
                <div className="space-y-4">
                    {recommendedUsers.map((u, i) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden ring-1 ring-primary/20">
                                    <div className="w-full h-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-[10px] font-black text-white">
                                        {u.name[0]}
                                    </div>
                                </div>
                                <div>
                                    <Link href={`/u/${u.name}`} className="text-xs font-bold text-foreground group-hover:text-primary transition-colors hover:underline">
                                        {u.name}
                                    </Link>
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide">Impact: {u.impact}</p>
                                </div>
                            </div>
                            <button className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                                Follow
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. FOOTER */}
            <div className="pt-4 border-t border-white/5">
                <Link href="/help" className="flex items-center justify-between text-white/40 hover:text-white transition-colors cursor-pointer mb-4">
                    <span className="text-xs font-bold">Community Guidelines</span>
                    <ArrowRight size={14} />
                </Link>
                <div className="flex gap-3 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    <Link href="/help" className="hover:text-white transition-colors">About</Link>
                    <Link href="/help" className="hover:text-white transition-colors">Privacy</Link>
                    <Link href="/help" className="hover:text-white transition-colors">Terms</Link>
                    <span>© 2026</span>
                </div>
            </div>

        </div>
    );
}

export default memo(RightSidebar);
