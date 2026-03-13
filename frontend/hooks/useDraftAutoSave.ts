import { useEffect, useRef, useState } from 'react';
import { getScopedKey } from '../app/lib/accountUtils';

interface DraftData {
    content: string;
    imageUrl: string;
    isAnonymous: boolean;
    selectedTimelineId: string | null;
    collaborators: string[];
    timestamp: number;
}

const DRAFT_KEY = 'post_draft';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

export function useDraftAutoSave(
    user_id: string | undefined,
    content: string,
    imageUrl: string,
    isAnonymous: boolean,
    selectedTimelineId: string | null,
    collaborators: string[]
) {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>(undefined);

    // Save draft to localStorage
    const saveDraft = () => {
        if (!content.trim() && !imageUrl) {
            // Don't save empty drafts
            localStorage.removeItem(getScopedKey(DRAFT_KEY, user_id));
            return;
        }

        setIsSaving(true);
        const draft: DraftData = {
            content,
            imageUrl,
            isAnonymous,
            selectedTimelineId,
            collaborators,
            timestamp: Date.now(),
        };

        try {
            localStorage.setItem(getScopedKey(DRAFT_KEY, user_id), JSON.stringify(draft));
            setLastSaved(new Date());
        } catch (error) {
            console.error('Failed to save draft:', error);
        } finally {
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    // Load draft from localStorage
    const loadDraft = (): DraftData | null => {
        try {
            const saved = localStorage.getItem(getScopedKey(DRAFT_KEY, user_id));
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load draft:', error);
        }
        return null;
    };

    // Clear draft
    const clearDraft = () => {
        localStorage.removeItem(getScopedKey(DRAFT_KEY, user_id));
        setLastSaved(null);
    };

    // Auto-save effect
    useEffect(() => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout for auto-save
        timeoutRef.current = setTimeout(() => {
            saveDraft();
        }, AUTO_SAVE_INTERVAL);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [content, imageUrl, isAnonymous, selectedTimelineId, JSON.stringify(collaborators)]);

    return {
        saveDraft,
        loadDraft,
        clearDraft,
        lastSaved,
        isSaving,
    };
}
