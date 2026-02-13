import { useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

interface UseInfiniteScrollOptions<T> {
    queryKey: any[];
    queryFn: (page: number) => Promise<T[]>;
    pageSize?: number;
    threshold?: number;
    enabled?: boolean;
}

export function useInfiniteScroll<T = any>({
    queryKey,
    queryFn,
    pageSize = 10,
    threshold = 0.8,
    enabled = true,
}: UseInfiniteScrollOptions<T>) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
    } = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = 0 }) => {
            const results = await queryFn(pageParam);
            return results;
        },
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < pageSize) return undefined;
            return allPages.length;
        },
        initialPageParam: 0,
        enabled,
    });

    // Set up intersection observer
    useEffect(() => {
        if (!enabled || !loadMoreRef.current) return;

        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [enabled, hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);

    // Flatten pages into single array
    const items = data?.pages.flatMap((page) => page) ?? [];

    return {
        items,
        loadMoreRef,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        fetchNextPage,
    };
}
