"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    action: () => void;
    category: 'navigation' | 'actions' | 'global';
}

interface KeyboardShortcutsContextType {
    shortcuts: KeyboardShortcut[];
    registerShortcut: (shortcut: KeyboardShortcut) => void;
    unregisterShortcut: (key: string) => void;
    showHelp: boolean;
    setShowHelp: (show: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
    const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
    const [showHelp, setShowHelp] = useState(false);
    const router = useRouter();

    const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
        setShortcuts(prev => [...prev.filter(s => s.key !== shortcut.key), shortcut]);
    }, []);

    const unregisterShortcut = useCallback((key: string) => {
        setShortcuts(prev => prev.filter(s => s.key !== key));
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            // Global shortcuts that work even in inputs
            if (e.key === 'Escape') {
                setShowHelp(false);
                return;
            }

            if (e.key === '?' && e.shiftKey && !isInput) {
                e.preventDefault();
                setShowHelp(true);
                return;
            }

            // Skip other shortcuts if in input (except Escape and ?)
            if (isInput && e.key !== '/') return;

            // Find matching shortcut
            const shortcut = shortcuts.find(s => {
                const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
                const ctrlMatch = s.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
                const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
                const altMatch = s.alt ? e.altKey : !e.altKey;
                return keyMatch && ctrlMatch && shiftMatch && altMatch;
            });

            if (shortcut) {
                e.preventDefault();
                shortcut.action();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);

    return (
        <KeyboardShortcutsContext.Provider value={{ shortcuts, registerShortcut, unregisterShortcut, showHelp, setShowHelp }}>
            {children}
        </KeyboardShortcutsContext.Provider>
    );
}

export function useKeyboardShortcuts() {
    const context = useContext(KeyboardShortcutsContext);
    if (!context) {
        throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
    }
    return context;
}
