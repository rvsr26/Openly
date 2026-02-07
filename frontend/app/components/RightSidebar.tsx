"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { TrendingUp, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { User } from "firebase/auth";
import { memo } from "react";

interface TrendingTopic {
    topic: string;
    posts_count: number;
}

interface RightSidebarProps {
    user: User | null;
    userPhoto?: string;
}

function RightSidebar({
    user,
    userPhoto,
}: RightSidebarProps) {

    const { data: trending = [], isLoading } = useQuery<TrendingTopic[]>({
        queryKey: ["trending"],
        queryFn: async () => {
            const res = await api.get("/stats/trending");
            return res.data;
        },
        staleTime: 1000 * 60 * 5 // 5 mins
    });

    // Fetch Suggested Users
    const { data: suggestedUsers = [] } = useQuery({
        queryKey: ["suggestedUsers", user?.uid],
        queryFn: async () => {
            // Fetch users, passing current user ID to exclude them
            const res = await api.get(`/users/suggested?user_id=${user?.uid || ''}`);
            return res.data;
        },
        staleTime: 1000 * 60 * 5, // 5 mins
        enabled: true
    });

    return (
        <div className="w-full space-y-6">

            {/* ... (Trending Section remains unchanged) ... */}

            {/* 2. TRENDING TOPICS */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Trending Topics</h3>
                    <TrendingUp size={16} className="text-primary" />
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">Loading trends...</div>
                    ) : (trending || []).length > 0 ? (
                        trending.map((t) => (
                            <Link
                                key={t.topic}
                                href={`/search?q=${encodeURIComponent(t.topic)}`}
                                className="flex justify-between items-center group p-2 rounded-xl hover:bg-white/5 transition-colors"
                            >
                                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">#{t.topic}</span>
                                <span className="text-[10px] font-bold text-muted-foreground bg-primary/5 px-2 py-0.5 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    {t.posts_count || '1.2k'} posts
                                </span>
                            </Link>
                        ))
                    ) : (
                        [
                            { tag: '#Startup', count: '12.5k' },
                            { tag: '#Failure', count: '8.2k' },
                            { tag: '#Growth', count: '5.1k' },
                            { tag: '#Career', count: '3.4k' },
                            { tag: '#LifeLesson', count: '2.9k' }
                        ].map(item => (
                            <Link
                                key={item.tag}
                                href={`/search?q=${encodeURIComponent(item.tag.replace('#', ''))}`}
                                className="flex justify-between items-center group p-2 rounded-xl hover:bg-white/5 transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{item.tag}</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">Trending in India</span>
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground bg-primary/5 px-2 py-1 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">{item.count}</span>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* 3. RECOMMENDED USERS */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-black text-foreground mb-6 uppercase tracking-widest">People to Follow</h3>
                <div className="space-y-4">
                    {suggestedUsers.length > 0 ? (
                        suggestedUsers.map((u: any) => (
                            <div key={u.uid} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden ring-1 ring-primary/20">
                                        {u.photoURL ? (
                                            <img src={u.photoURL} alt={u.username} className="w-full h-full object-cover" />
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
                                <button className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
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
