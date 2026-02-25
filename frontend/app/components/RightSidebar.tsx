"use client";

import { useQuery } from "@tanstack/react-query";
import api, { getAbsUrl } from "../lib/api";
import { TrendingUp, X, ArrowRight, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { User } from "firebase/auth";
import { memo, useState } from "react";
import { toast } from "sonner";
import TrendingTopics from "./TrendingTopics";

interface TrendingTopic {
    topic: string;
    posts_count: number;
}

interface RightSidebarProps {
    user: any | null;
    userPhoto?: string;
}

function RightSidebar({
    user,
    userPhoto,
}: RightSidebarProps) {
    const [sendingInsights, setSendingInsights] = useState(false);

    const { data: trending = [], isLoading } = useQuery<TrendingTopic[]>({
        queryKey: ["trending"],
        queryFn: async () => {
            const res = await api.get("/stats/trending");
            return res.data;
        },
        staleTime: 1000 * 60 * 5 // 5 mins
    });

    // Fetch Suggested Users
    const { data: suggestedUsers = [], refetch: refetchSuggested } = useQuery({
        queryKey: ["suggestedUsers", user?.uid],
        queryFn: async () => {
            const res = await api.get(`/users/suggested?user_id=${user?.uid || ''}`);
            return res.data;
        },
        staleTime: 1000 * 60 * 5,
        enabled: !!user?.uid
    });

    const handleConnect = async (targetId: string) => {
        if (!user) {
            alert("Please login to connect");
            return;
        }
        try {
            await api.post(`/connect/${targetId}`, {
                requester_id: user.uid
            });
            refetchSuggested();
        } catch (e) {
            console.error("Failed to connect", e);
        }
    };

    const handleSendInsights = async () => {
        if (!user?.uid) {
            toast.error("Please login first.");
            return;
        }

        setSendingInsights(true);
        try {
            const res = await api.post(`/users/${user.uid}/insights/send`);
            toast.success("Weekly Insights Report Sent!", {
                description: "Check your connected email inbox or output folder.",
            });
        } catch (err: any) {
            console.error("Failed to send insights:", err);
            toast.error("Failed to send insights", {
                description: err.response?.data?.detail || "Please try again later.",
            });
        } finally {
            setSendingInsights(false);
        }
    };

    return (
        <div className="w-full space-y-6">

            {/* 1. WEEKLY INSIGHTS WIDGET */}
            {user && (
                <div className="glass-card p-6 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <Mail size={16} />
                            </div>
                            <h3 className="text-sm font-black text-foreground tracking-widest uppercase">Weekly Insights</h3>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">Get a personalized report on your profile growth, engagement, and productivity.</p>
                        <button
                            onClick={handleSendInsights}
                            disabled={sendingInsights}
                            className="w-full mt-2 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {sendingInsights ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                            {sendingInsights ? "Generating..." : "Email My Report"}
                        </button>
                    </div>
                </div>
            )}

            {/* ... (Trending Section remains unchanged) ... */}

            {/* 2. TRENDING TOPICS */}
            <TrendingTopics />

            {/* 3. RECOMMENDED USERS */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-widest">People to Follow</h3>
                <div className="space-y-4">
                    {suggestedUsers.length > 0 ? (
                        [...new Map(suggestedUsers.map((u: any) => [u.uid, u])).values()].map((u: any) => (
                            <div key={u.uid} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden ring-1 ring-primary/20">
                                        {u.photoURL ? (
                                            <img src={getAbsUrl(u.photoURL)} alt={u.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-[10px] font-black text-white">
                                                {u.display_name?.[0] || u.username?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 max-w-[100px]">
                                        <Link href={`/u/${u.username}`} className="text-xs font-bold text-foreground group-hover:text-primary transition-colors hover:underline truncate block">
                                            {u.display_name || u.username}
                                        </Link>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide truncate">@{u.username}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleConnect(u.uid)}
                                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                                >
                                    Follow
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-[10px] text-muted-foreground font-bold text-center py-4">
                            No suggestions available properly
                        </div>
                    )}
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
