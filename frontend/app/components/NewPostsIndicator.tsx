"use client";

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewPostsIndicatorProps {
    onLoadNew: () => void;
}

export default function NewPostsIndicator({ onLoadNew }: NewPostsIndicatorProps) {
    const [newPostsCount, setNewPostsCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Simulate checking for new posts every 30 seconds
        const interval = setInterval(() => {
            // TODO: Replace with actual API call or WebSocket
            const hasNewPosts = Math.random() > 0.7;
            if (hasNewPosts) {
                setNewPostsCount(prev => prev + Math.floor(Math.random() * 5) + 1);
                setIsVisible(true);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleLoadNew = () => {
        onLoadNew();
        setNewPostsCount(0);
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && newPostsCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-40"
                >
                    <button
                        onClick={handleLoadNew}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                    >
                        <ArrowUp className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'}
                        </span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
