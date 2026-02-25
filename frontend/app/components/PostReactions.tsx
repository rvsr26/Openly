"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp } from "lucide-react";

interface PostReactionsProps {
    postId: string;
    onReact: (type: string) => void;
    currentReaction?: string;
    reactionCount: number;
    disabled?: boolean;
}

const REACTIONS = [
    { type: "like", emoji: "❤️", label: "Like" },
    { type: "laugh", emoji: "😂", label: "Haha" },
    { type: "insightful", emoji: "💡", label: "Insightful" },
    { type: "clap", emoji: "👏", label: "Bravo" },
];

export default function PostReactions({ postId, onReact, currentReaction, reactionCount, disabled }: PostReactionsProps) {
    const [isHovered, setIsHovered] = useState(false);

    const activeEmoji = REACTIONS.find(r => r.type === currentReaction)?.emoji;

    return (
        <div
            className="relative"
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* The Main Button */}
            <button
                onClick={() => !disabled && onReact(currentReaction ? "remove" : "like")} // default to like if clicking main button without selecting
                disabled={disabled}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${currentReaction ? "bg-primary/20 text-primary shadow-xl shadow-primary/20 hover:bg-primary/30" : "bg-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {activeEmoji ? (
                    <span className="text-base leading-none">{activeEmoji}</span>
                ) : (
                    <ThumbsUp size={16} className={currentReaction ? "fill-white" : ""} />
                )}
                <span>{currentReaction ? REACTIONS.find(r => r.type === currentReaction)?.label : "Support"}</span>
                {reactionCount > 0 && <span className="ml-1 opacity-80 pl-1 border-l border-current/20 font-black">{reactionCount}</span>}
            </button>

            {/* Reaction Hover Menu */}
            <AnimatePresence>
                {isHovered && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: -50 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute bottom-full left-0 mb-2 bg-card border border-border/50 shadow-2xl rounded-full px-3 py-2 flex gap-1 z-50 backdrop-blur-xl"
                    >
                        {REACTIONS.map((reaction, i) => (
                            <motion.button
                                key={reaction.type}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReact(currentReaction === reaction.type ? "remove" : reaction.type);
                                    setIsHovered(false);
                                }}
                                className={`text-2xl p-1 hover:scale-125 transition-transform origin-bottom ${currentReaction === reaction.type ? 'scale-110 drop-shadow-md relative after:content-[""] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full' : ''}`}
                                title={reaction.label}
                            >
                                {reaction.emoji}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
