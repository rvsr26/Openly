"use client";

import { motion } from 'framer-motion';

export default function PostSkeleton() {
    return (
        <div className="card-simple p-6 mb-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />

                <div className="flex-1">
                    {/* Name and time */}
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>

                {/* Menu button */}
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
            </div>

            {/* Content */}
            <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-11/12 bg-muted rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-muted rounded animate-pulse" />
            </div>

            {/* Image placeholder (optional) */}
            <div className="h-48 w-full bg-muted rounded-xl animate-pulse mb-4" />

            {/* Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-border">
                <div className="h-8 w-16 bg-muted rounded-lg animate-pulse" />
                <div className="h-8 w-16 bg-muted rounded-lg animate-pulse" />
                <div className="h-8 w-16 bg-muted rounded-lg animate-pulse" />
            </div>
        </div>
    );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <PostSkeleton key={i} />
            ))}
        </>
    );
}
