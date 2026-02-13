"use client";

import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Heart, Bookmark, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SwipeablePostProps {
    children: React.ReactNode;
    postId: string;
    isOwner?: boolean;
    onLike?: () => void;
    onBookmark?: () => void;
    onDelete?: () => void;
}

export default function SwipeablePost({
    children,
    postId,
    isOwner = false,
    onLike,
    onBookmark,
    onDelete,
}: SwipeablePostProps) {
    const [isDragging, setIsDragging] = useState(false);
    const x = useMotionValue(0);

    // Transform x position to opacity for action indicators
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const bookmarkOpacity = useTransform(x, [-100, 0], [1, 0]);
    const deleteOpacity = useTransform(x, [-150, -100], [0, 1]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        setIsDragging(false);
        const offset = info.offset.x;

        // Swipe right - Like
        if (offset > 100) {
            onLike?.();
            toast.success('Post liked!');
        }
        // Swipe left - Bookmark
        else if (offset < -100 && offset > -150) {
            onBookmark?.();
            toast.success('Post bookmarked!');
        }
        // Swipe far left - Delete (only for owner)
        else if (offset < -150 && isOwner) {
            onDelete?.();
        }

        // Reset position
        x.set(0);
    };

    return (
        <div className="relative overflow-hidden">
            {/* Background Actions */}
            <div className="absolute inset-0 flex items-center justify-between px-8">
                {/* Like (Right swipe) */}
                <motion.div
                    style={{ opacity: likeOpacity }}
                    className="flex items-center gap-2 text-red-500"
                >
                    <Heart className="w-6 h-6 fill-current" />
                    <span className="font-semibold">Like</span>
                </motion.div>

                {/* Bookmark/Delete (Left swipe) */}
                <div className="flex items-center gap-4">
                    <motion.div
                        style={{ opacity: bookmarkOpacity }}
                        className="flex items-center gap-2 text-primary"
                    >
                        <span className="font-semibold">Bookmark</span>
                        <Bookmark className="w-6 h-6 fill-current" />
                    </motion.div>

                    {isOwner && (
                        <motion.div
                            style={{ opacity: deleteOpacity }}
                            className="flex items-center gap-2 text-destructive"
                        >
                            <span className="font-semibold">Delete</span>
                            <Trash2 className="w-6 h-6" />
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Swipeable Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: isOwner ? -200 : -150, right: 150 }}
                dragElastic={0.2}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className={`relative bg-card ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
                {children}
            </motion.div>
        </div>
    );
}
