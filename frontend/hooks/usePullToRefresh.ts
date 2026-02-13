import { useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
    resistance?: number;
}

export function usePullToRefresh({
    onRefresh,
    threshold = 80,
    resistance = 2.5,
}: UsePullToRefreshOptions) {
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);

    let startY = 0;
    let currentY = 0;

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Only trigger if at top of page
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
            setIsPulling(true);
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling || isRefreshing) return;

        currentY = e.touches[0].clientY;
        const distance = currentY - startY;

        if (distance > 0) {
            // Apply resistance
            const adjustedDistance = distance / resistance;
            setPullDistance(adjustedDistance);

            // Prevent default scroll if pulling
            if (distance > 10) {
                e.preventDefault();
            }
        }
    }, [isPulling, isRefreshing, resistance]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling) return;

        setIsPulling(false);

        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

    const pullToRefreshProps = {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    };

    return {
        pullToRefreshProps,
        isPulling,
        isRefreshing,
        pullDistance,
        threshold,
    };
}
