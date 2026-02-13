"use client";

import { useEffect } from 'react';
import { useKeyboardShortcuts } from '@/context/KeyboardShortcutsContext';

interface UseKeyboardShortcutOptions {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    category: 'navigation' | 'actions' | 'global';
    action: () => void;
    enabled?: boolean;
}

export function useKeyboardShortcut({
    key,
    ctrl = false,
    shift = false,
    alt = false,
    description,
    category,
    action,
    enabled = true,
}: UseKeyboardShortcutOptions) {
    const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

    useEffect(() => {
        if (enabled) {
            registerShortcut({ key, ctrl, shift, alt, description, category, action });
            return () => unregisterShortcut(key);
        }
    }, [key, ctrl, shift, alt, description, category, action, enabled, registerShortcut, unregisterShortcut]);
}
