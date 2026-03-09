import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UndoableAction<T = any> {
    action: () => Promise<void>;
    undo: () => Promise<void>;
    message: string;
    data?: T;
}

const UNDO_TIMEOUT = 5000; // 5 seconds

export function useUndoableAction() {
    const [pendingAction, setPendingAction] = useState<UndoableAction | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout>(undefined);

    const executeWithUndo = useCallback(async <T = any>(
        action: UndoableAction<T>
    ) => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Execute the action
        await action.action();

        // Show undo toast
        const toastId = toast.success(action.message, {
            duration: UNDO_TIMEOUT,
            action: {
                label: 'Undo',
                onClick: async () => {
                    await action.undo();
                    toast.success('Action undone');
                    setPendingAction(null);
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                    }
                },
            },
        });

        // Set pending action
        setPendingAction(action);

        // Auto-clear after timeout
        timeoutRef.current = setTimeout(() => {
            setPendingAction(null);
        }, UNDO_TIMEOUT);

        return toastId;
    }, []);

    return {
        executeWithUndo,
        pendingAction,
    };
}

// Specific undoable actions
export function useUndoableDelete() {
    const { executeWithUndo } = useUndoableAction();

    const deleteWithUndo = useCallback(async (
        itemId: string,
        itemType: 'post' | 'comment',
        deleteFn: () => Promise<void>,
        restoreFn: () => Promise<void>
    ) => {
        return executeWithUndo({
            action: deleteFn,
            undo: restoreFn,
            message: `${itemType === 'post' ? 'Post' : 'Comment'} deleted`,
            data: { itemId, itemType },
        });
    }, [executeWithUndo]);

    return { deleteWithUndo };
}

export function useUndoableUnfollow() {
    const { executeWithUndo } = useUndoableAction();

    const unfollowWithUndo = useCallback(async (
        userId: string,
        username: string,
        unfollowFn: () => Promise<void>,
        followFn: () => Promise<void>
    ) => {
        return executeWithUndo({
            action: unfollowFn,
            undo: followFn,
            message: `Unfollowed @${username}`,
            data: { userId, username },
        });
    }, [executeWithUndo]);

    return { unfollowWithUndo };
}
