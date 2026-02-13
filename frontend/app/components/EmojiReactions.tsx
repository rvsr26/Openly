"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { toast } from 'sonner';

interface EmojiReaction {
    emoji: string;
    label: string;
    count: number;
    reacted: boolean;
}

const REACTIONS = [
    { emoji: '👍', label: 'Like' },
    { emoji: '❤️', label: 'Love' },
    { emoji: '😂', label: 'Funny' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '🔥', label: 'Fire' },
];

interface EmojiReactionsProps {
    postId: string;
    initialReactions?: EmojiReaction[];
}

export default function EmojiReactions({ postId, initialReactions = [] }: EmojiReactionsProps) {
    const [reactions, setReactions] = useState<EmojiReaction[]>(
        REACTIONS.map(r => {
            const existing = initialReactions.find(ir => ir.emoji === r.emoji);
            return {
                ...r,
                count: existing?.count || 0,
                reacted: existing?.reacted || false,
            };
        })
    );
    const [showPicker, setShowPicker] = useState(false);

    const handleReaction = async (emoji: string) => {
        const reaction = reactions.find(r => r.emoji === emoji);
        if (!reaction) return;

        const wasReacted = reaction.reacted;

        // Optimistic update
        setReactions(prev =>
            prev.map(r =>
                r.emoji === emoji
                    ? {
                        ...r,
                        count: wasReacted ? r.count - 1 : r.count + 1,
                        reacted: !wasReacted,
                    }
                    : r
            )
        );

        try {
            // TODO: Replace with actual API call
            // await api.post(`/posts/${postId}/react`, { emoji, action: wasReacted ? 'remove' : 'add' });
        } catch (error) {
            // Rollback on error
            setReactions(prev =>
                prev.map(r =>
                    r.emoji === emoji
                        ? {
                            ...r,
                            count: wasReacted ? r.count + 1 : r.count - 1,
                            reacted: wasReacted,
                        }
                        : r
                )
            );
            toast.error('Failed to react');
        }

        setShowPicker(false);
    };

    const activeReactions = reactions.filter(r => r.count > 0);

    return (
        <div className="relative">
            {/* Active Reactions */}
            <div className="flex items-center gap-1 flex-wrap">
                {activeReactions.map((reaction) => (
                    <button
                        key={reaction.emoji}
                        onClick={() => handleReaction(reaction.emoji)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${reaction.reacted
                                ? 'bg-primary/20 border border-primary text-primary'
                                : 'bg-muted/50 border border-border hover:bg-muted'
                            }`}
                    >
                        <span>{reaction.emoji}</span>
                        <span className="font-medium">{reaction.count}</span>
                    </button>
                ))}

                {/* Add Reaction Button */}
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-muted/50 border border-border hover:bg-muted transition-colors"
                    aria-label="Add reaction"
                >
                    <span className="text-sm">+</span>
                </button>
            </div>

            {/* Reaction Picker */}
            <AnimatePresence>
                {showPicker && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowPicker(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-xl shadow-lg p-2 z-50"
                        >
                            <div className="flex gap-1">
                                {REACTIONS.map((reaction) => (
                                    <button
                                        key={reaction.emoji}
                                        onClick={() => handleReaction(reaction.emoji)}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-xl"
                                        title={reaction.label}
                                    >
                                        {reaction.emoji}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
