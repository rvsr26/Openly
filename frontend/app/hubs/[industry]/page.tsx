"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/lib/api";
import PostItem from "@/app/components/PostItem";
import HubSentiment from "@/app/components/HubSentiment";
import { FeedSkeleton } from "@/app/components/PostSkeleton";
import { Briefcase, Flame, Clock, Trophy, ChevronLeft, Search } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function HubPage() {
    const params = useParams();
    const industry = decodeURIComponent(params.industry as string);
    const hubName = industry.charAt(0).toUpperCase() + industry.slice(1);
    const [sortBy, setSortBy] = useState<"new" | "hot" | "top">("new");
    const { user: authUser } = useAuth();

    const { data: profile, refetch } = useQuery({
        queryKey: ["userProfile", authUser?.uid],
        queryFn: async () => {
            if (!authUser) return null;
            const res = await api.get(`/users/${authUser.uid}/profile`);
            return res.data;
        },
        enabled: !!authUser,
    });

    const followedHubs = profile?.user_info?.followed_hubs || [];
    const isJoined = followedHubs.includes(hubName);

    const handleToggleHub = async () => {
        if (!authUser) {
            toast.error("Please login to join a hub");
            return;
        }

        try {
            if (isJoined) {
                await api.post(`/users/${authUser.uid}/hubs/${hubName}/leave`);
                toast.success(`Left ${hubName} Hub`);
            } else {
                await api.post(`/users/${authUser.uid}/hubs/${hubName}/join`);
                toast.success(`Joined ${hubName} Hub`);
            }
            refetch();
        } catch (error) {
            toast.error("Failed to update hub status");
        }
    };

    const { data: posts = [], isLoading } = useQuery({
        queryKey: ["hub-posts", industry, sortBy],
        queryFn: async () => {
            const res = await api.get(`/api/v1/hubs/${industry}?limit=20`);
            return res.data;
        },
        staleTime: 1000 * 60,
    });

    return (
        <div className="min-h-screen pt-24 pb-20 max-w-2xl mx-auto px-4">
            {/* Header */}
            <div className="flex items-center gap-6 mb-8 group">
                <Link href="/feed">
                    <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-foreground">
                        <ChevronLeft size={20} />
                    </button>
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Briefcase className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground capitalize">{hubName} Hub</h1>
                            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                                {posts.length} PROFESSIONAL INSIGHTS
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleToggleHub}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${isJoined
                            ? "bg-white/5 border border-white/10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                            : "bg-primary text-white hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
                            }`}
                    >
                        {isJoined ? "Leave Hub" : "Join Hub"}
                    </button>
                </div>
            </div>

            {/* AI Sentiment Analysis */}
            <div className="mb-8">
                <HubSentiment hubName={hubName} />
            </div>

            {/* Hub Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={14} />
                    <input
                        type="text"
                        placeholder={`Search within ${industry}...`}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                </div>

                <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                    {([
                        { id: "new", label: "Newest", icon: Clock },
                        { id: "hot", label: "Trending", icon: Flame },
                        { id: "top", label: "Top", icon: Trophy },
                    ] as const).map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSortBy(s.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === s.id
                                ? "bg-white text-black shadow-xl"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <s.icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{s.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Posts Grid */}
            <AnimatePresence mode="popLayout">
                {isLoading ? (
                    <FeedSkeleton key="skeleton" />
                ) : posts.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-10 h-10 text-muted-foreground/20" />
                        </div>
                        <h3 className="text-lg font-black text-foreground mb-2">No Insights Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Be the first professional to share insights in the {industry} hub.
                        </p>
                        <Link href="/feed">
                            <button className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform">
                                Share Insight
                            </button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post: any, i: number) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <PostItem post={post} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
