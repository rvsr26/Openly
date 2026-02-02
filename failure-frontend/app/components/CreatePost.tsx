"use client";

import { User } from "firebase/auth";
import { motion } from "framer-motion";
import { getAbsUrl } from "../lib/api";

interface CreatePostProps {
    user: User | null;
    content: string;
    setContent: (val: string) => void;
    isAnonymous: boolean;
    setIsAnonymous: (val: boolean) => void;
    handleSubmit: () => void;
    loading: boolean;
}

export default function CreatePost({
    user,
    content,
    setContent,
    isAnonymous,
    setIsAnonymous,
    handleSubmit,
    loading
}: CreatePostProps) {
    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card mb-8 p-6 !rounded-[2rem] border border-primary/20 bg-primary/[0.02] group/create overflow-hidden"
        >
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-primary opacity-70">Share a Review</h3>
            <div className="space-y-4">
                <div className="flex gap-4">
                    <img
                        src={getAbsUrl(user.photoURL)}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary/10 group-hover/create:rotate-3 transition-all duration-500 shadow-lg"
                        alt="User Profile"
                    />
                    <textarea
                        className="flex-1 bg-white/50 dark:bg-zinc-900/50 border-2 border-transparent focus:border-primary/20 rounded-2xl px-5 py-4 focus:outline-none hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-all duration-300 resize-none h-[100px] text-sm font-medium placeholder:text-muted-foreground/40 shadow-inner"
                        placeholder="What's your suggestion? Share a failure, a review, or an insight..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-2">
                    <label className="flex items-center space-x-3 text-muted-foreground text-xs cursor-pointer select-none group/anon hover:text-primary transition-colors">
                        <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${isAnonymous ? "bg-primary border-primary rotate-12 shadow-sm" : "border-muted-foreground/30 group-hover/anon:border-primary/50"}`}>
                            {isAnonymous && <span className="text-white text-[10px] font-black">✓</span>}
                        </div>
                        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="hidden" />
                        <span className="font-black uppercase tracking-widest opacity-70 group-hover/anon:opacity-100 transition-all">Post Anonymously</span>
                    </label>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !content.trim()}
                        className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-[0.2em] premium-shadow hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all duration-300"
                    >
                        {loading ? "POSTING..." : "SHARE REVIEW"}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
