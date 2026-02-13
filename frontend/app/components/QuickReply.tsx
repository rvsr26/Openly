"use client";

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/api';

interface QuickReplyProps {
    postId: string;
    onReplyAdded?: () => void;
}

export default function QuickReply({ postId, onReplyAdded }: QuickReplyProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // TODO: Replace with actual API call
            // await api.post(`/posts/${postId}/comments`, { content });
            toast.success('Reply posted!');
            setContent('');
            setIsOpen(false);
            onReplyAdded?.();
        } catch (error) {
            toast.error('Failed to post reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-icon"
                aria-label="Quick reply"
            >
                <MessageCircle className="w-4 h-4" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Reply Box */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                        >
                            <div className="p-4">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-foreground">Quick Reply</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="btn-icon"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit}>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Write your reply..."
                                        className="w-full min-h-[80px] px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                        autoFocus
                                    />

                                    <div className="flex justify-end gap-2 mt-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="btn-secondary text-xs"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!content.trim() || isSubmitting}
                                            className="btn-primary text-xs"
                                        >
                                            {isSubmitting ? 'Posting...' : 'Reply'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
