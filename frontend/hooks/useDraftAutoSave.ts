import { useEffect, useRef, useState } from 'react';

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
    content: string,
    imageUrl: string,
    isAnonymous: boolean,
    selectedTimelineId: string | null,
    collaborators: string[]
) {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    // Save draft to localStorage
    const saveDraft = () => {
        if (!content.trim() && !imageUrl) {
            // Don't save empty drafts
            localStorage.removeItem(DRAFT_KEY);
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
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
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
            const saved = localStorage.getItem(DRAFT_KEY);
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
        localStorage.removeItem(DRAFT_KEY);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, imageUrl, isAnonymous, selectedTimelineId, JSON.stringify(collaborators)]);

    return {
        saveDraft,
        loadDraft,
        clearDraft,
        lastSaved,
        isSaving,
    };
}
