"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, PieChart } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";
import { Poll } from "../types";
import { useAuth } from "@/context/AuthContext";

interface PollBlockProps {
    poll: Poll;
    postId: string;
}

export default function PollBlock({ poll: initialPoll, postId }: PollBlockProps) {
    const [poll, setPoll] = useState<Poll>(initialPoll);
    const [votingOn, setVotingOn] = useState<string | null>(null);
    const { user } = useAuth();

    // Check if poll has ended
    const isExpired = !!(poll.ends_at && new Date(poll.ends_at) < new Date());

    const handleVote = async (optionId: string) => {
        if (!user && !poll.allow_anonymous) {
            toast.error("Please log in to vote on this poll.");
            return;
        }
        if (isExpired) {
            toast.error("This poll has ended.");
            return;
        }

        setVotingOn(optionId);
        try {
            // Use guest ID if allowed and not logged in
            const voterId = user?.uid || "guest_" + Math.random().toString(36).substring(7);

            const res = await api.post(`/posts/${postId}/poll/vote`, {
                user_id: voterId,
                option_id: optionId
            });

            setPoll(res.data.poll);

            if (res.data.poll.voted_option_id === optionId) {
                toast.success("Vote recorded!");
            } else {
                toast.success("Vote removed!");
            }
        } catch (err: any) {
            console.error("VOTE ERROR:", err);
            toast.error(err.response?.data?.detail || "Failed to record vote.");
        } finally {
            setVotingOn(null);
        }
    };

    const total = Math.max(poll.total_votes, 1); // Avoid div by 0 for percentages

    return (
        <div className="my-4 p-5 rounded-2xl bg-black/20 border border-white/5 shadow-inner">
            <div className="flex items-center gap-2 mb-4">
                <PieChart size={18} className="text-primary" />
                <h4 className="text-sm font-black text-foreground leading-tight tracking-wide">
                    {poll.question}
                </h4>
            </div>

            <div className="space-y-3 relative">
                {poll.options.map((opt) => {
                    const isVoted = poll.voted_option_id === opt.id;
                    const percentage = poll.total_votes > 0 ? Math.round((opt.votes / total) * 100) : 0;
                    // Determine if we show results: either the user has voted or the poll is expired
                    const showResults = !!poll.voted_option_id || isExpired;

                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleVote(opt.id)}
                            disabled={votingOn !== null || (isExpired && !isVoted)}
                            className={`w-full relative overflow-hidden rounded-xl border transition-all duration-300 group
                ${isVoted ? "border-primary/50 bg-primary/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"}
                ${(votingOn !== null || isExpired) && !isVoted ? "opacity-70 cursor-not-allowed" : ""}
                h-12 flex items-center px-4
              `}
                        >
                            {/* Progress Bar background if showing results */}
                            {showResults && (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={`absolute left-0 top-0 h-full -z-10 ${isVoted ? "bg-primary/20" : "bg-white/5"}`}
                                />
                            )}

                            {/* Option Text */}
                            <div className="flex items-center justify-between w-full z-10">
                                <div className="flex items-center gap-3">
                                    {votingOn === opt.id ? (
                                        <Loader2 size={16} className="animate-spin text-primary" />
                                    ) : isVoted ? (
                                        <CheckCircle2 size={16} className="text-primary" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-white/20 group-hover:border-primary/50 transition-colors" />
                                    )}
                                    <span className={`text-sm font-bold ${isVoted ? "text-primary" : "text-foreground"}`}>
                                        {opt.text}
                                    </span>
                                </div>

                                {/* Percentage Text */}
                                {showResults && (
                                    <span className={`text-xs font-black ${isVoted ? "text-primary" : "text-muted-foreground"}`}>
                                        {percentage}%
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                <p>{poll.total_votes} {poll.total_votes === 1 ? "vote" : "votes"}</p>
                <p className="flex items-center gap-2">
                    {isExpired ? "Poll closed" : "Poll active"}
                    {poll.allow_anonymous && !user && <span className="w-1 h-1 rounded-full bg-current opacity-30" />}
                    {poll.allow_anonymous && !user && "Anonymous voting allowed"}
                </p>
            </div>
        </div>
    );
}
