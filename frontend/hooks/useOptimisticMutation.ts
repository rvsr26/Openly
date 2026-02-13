import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface OptimisticUpdateOptions<TData, TVariables> {
    mutationFn: (variables: TVariables) => Promise<TData>;
    queryKey: any[];
    updateFn: (oldData: any, variables: TVariables) => any;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: any, variables: TVariables) => void;
}

export function useOptimisticMutation<TData = any, TVariables = any>({
    mutationFn,
    queryKey,
    updateFn,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
}: OptimisticUpdateOptions<TData, TVariables>) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onMutate: async (variables) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey });

            // Snapshot previous value
            const previousData = queryClient.getQueryData(queryKey);

            // Optimistically update
            queryClient.setQueryData(queryKey, (old: any) => updateFn(old, variables));

            // Return context with previous data
            return { previousData };
        },
        onError: (error, variables, context: any) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData);
            }

            toast.error(errorMessage || 'Action failed');
            onError?.(error, variables);
        },
        onSuccess: (data, variables) => {
            if (successMessage) {
                toast.success(successMessage);
            }
            onSuccess?.(data, variables);
        },
        onSettled: () => {
            // Refetch to ensure data is in sync
            queryClient.invalidateQueries({ queryKey });
        },
    });
}

// Specific optimistic mutations
export function useOptimisticLike(postId: string) {
    return useOptimisticMutation({
        mutationFn: async ({ liked }: { liked: boolean }) => {
            // API call to like/unlike
            return { success: true };
        },
        queryKey: ['post', postId],
        updateFn: (oldData, { liked }) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                liked,
                likes_count: oldData.likes_count + (liked ? 1 : -1),
            };
        },
    });
}

export function useOptimisticBookmark(postId: string) {
    return useOptimisticMutation({
        mutationFn: async ({ bookmarked }: { bookmarked: boolean }) => {
            // API call to bookmark/unbookmark
            return { success: true };
        },
        queryKey: ['post', postId],
        updateFn: (oldData, { bookmarked }) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                bookmarked,
            };
        },
        successMessage: (variables: { bookmarked: boolean }) =>
            variables.bookmarked ? 'Post bookmarked' : 'Bookmark removed',
    });
}

export function useOptimisticFollow(userId: string) {
    return useOptimisticMutation({
        mutationFn: async ({ following }: { following: boolean }) => {
            // API call to follow/unfollow
            return { success: true };
        },
        queryKey: ['user', userId],
        updateFn: (oldData, { following }) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                following,
                followers_count: oldData.followers_count + (following ? 1 : -1),
            };
        },
    });
}
