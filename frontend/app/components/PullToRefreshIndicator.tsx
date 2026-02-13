"use client";

import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PullToRefreshIndicatorProps {
    isPulling: boolean;
    isRefreshing: boolean;
    pullDistance: number;
    threshold: number;
}

export default function PullToRefreshIndicator({
    isPulling,
    isRefreshing,
    pullDistance,
    threshold,
}: PullToRefreshIndicatorProps) {
    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = progress * 360;

    return (
        <AnimatePresence>
            {(isPulling || isRefreshing) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
                    style={{ y: Math.min(pullDistance / 2, 40) }}
                >
                    <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full shadow-lg">
                        <motion.div
                            animate={{ rotate: isRefreshing ? 360 : rotation }}
                            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                        >
                            <RefreshCw className={`w-5 h-5 ${progress >= 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                        </motion.div>
                        <span className="text-sm font-medium text-foreground">
                            {isRefreshing ? 'Refreshing...' : progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
