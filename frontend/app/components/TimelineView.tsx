"use client";

import { useEffect, useState } from "react";
import { timelineApi, Timeline, TimelinePost } from "@/app/lib/timelineApi";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, Circle, ArrowDown, ExternalLink } from "lucide-react";
import Link from "next/link";

interface TimelineViewProps {
    timelineId: string;
}

export default function TimelineView({ timelineId }: TimelineViewProps) {
    const [timeline, setTimeline] = useState<Timeline | null>(null);
    const [posts, setPosts] = useState<TimelinePost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tData, pData] = await Promise.all([
                    timelineApi.getById(timelineId),
                    timelineApi.getPosts(timelineId)
                ]);
                setTimeline(tData);
                setPosts(pData);
            } catch (err) {
                console.error("Failed to fetch timeline data", err);
            } finally {
                setLoading(false);
            }
        };

        if (timelineId) {
            fetchData();
        }
    }, [timelineId]);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Journey...</div>;
    if (!timeline) return <div className="p-8 text-center text-red-400">Journey not found</div>;

    return (
        <div className="w-full max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                    {timeline.status === 'completed' ? <CheckCircle size={14} /> : <Circle size={14} />}
                    {timeline.status} Journey
                </div>
                <h2 className="text-3xl font-black text-foreground mb-2">{timeline.title}</h2>
                {timeline.description && <p className="text-lg text-muted-foreground">{timeline.description}</p>}
            </div>

            {/* Timeline Visualization */}
            <div className="relative border-l-2 border-primary/20 ml-4 md:ml-8 space-y-8 pb-12">
                {posts.length === 0 ? (
                    <div className="pl-8 pt-2">
                        <p className="text-muted-foreground italic">No updates in this journey yet.</p>
                    </div>
                ) : (
                    posts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative pl-8 md:pl-12"
                        >
                            {/* Dot on line */}
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-4 border-primary shadow-lg shadow-primary/20" />

                            {/* Date */}
                            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
                                <Calendar size={12} />
                                {new Date(post.created_at).toLocaleDateString()}
                            </div>

                            {/* Card */}
                            <div className="glass-card p-5 rounded-xl border border-white/5 hover:border-primary/20 transition-all group">
                                <div className="prose prose-invert max-w-none text-sm text-foreground/90 line-clamp-4">
                                    {post.content}
                                </div>
                                {post.image_url && (
                                    <img src={post.image_url} alt="Post attachment" className="mt-3 rounded-lg w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                )}
                                <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                                    <Link href={`/posts/${post.id}`} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
                                        View Full Post <ExternalLink size={12} />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}

                {/* End Node */}
                <div className="absolute -left-[5px] bottom-0 w-2 h-2 rounded-full bg-primary/20" />
            </div>

            {/* Footer Action (placeholder for now) */}
            {timeline.status === 'active' && (
                <div className="text-center mt-8">
                    <button className="btn-primary flex items-center gap-2 mx-auto">
                        <ArrowDown size={16} /> Add Update to Journey
                    </button>
                </div>
            )}
        </div>
    );
}
