"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/lib/api";
import PostItem from "@/app/components/PostItem";
import { FeedSkeleton } from "@/app/components/PostSkeleton";
import { Hash, Flame, Clock, Trophy } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function TagPage() {
    const params = useParams();
    const tag = decodeURIComponent(params.tag as string).replace(/^#/, "");
    const [sortBy, setSortBy] = useState<"new" | "hot" | "top">("new");

    const { data: posts = [], isLoading } = useQuery({
        queryKey: ["tag-posts", tag, sortBy],
        queryFn: async () => {
            const res = await api.get(`/tags/${tag}/posts?sort_by=${sortBy}`);
            return res.data;
        },
        staleTime: 1000 * 60,
    });

    return (
        <div className="min-h-screen pt-24 pb-20 max-w-2xl mx-auto px-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/25">
                    <Hash className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-foreground">#{tag}</h1>
                    <p className="text-sm text-muted-foreground">{posts.length} posts</p>
                </div>
            </div>

            {/* Sort Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-background/80 backdrop-blur-xl rounded-2xl border border-white/10 mb-6">
                {([
                    { id: "new", label: "Newest", icon: Clock },
                    { id: "hot", label: "Trending", icon: Flame },
                    { id: "top", label: "Top", icon: Trophy },
                ] as const).map(s => (
                    <button
                        key={s.id}
                        onClick={() => setSortBy(s.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${sortBy === s.id
                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                            }`}
                    >
                        <s.icon className="w-4 h-4" />
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Posts */}
            {isLoading ? (
                <FeedSkeleton />
            ) : posts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <Hash className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-black text-foreground mb-1">No posts yet</h3>
                    <p className="text-sm text-muted-foreground">Be the first to post with #{tag}!</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {posts.map((post: any, i: number) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <PostItem post={post} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
