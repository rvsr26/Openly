"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from '@/context/KeyboardShortcutsContext';

export default function GlobalShortcuts() {
    const router = useRouter();
    const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

    useEffect(() => {
        // Global shortcuts
        const shortcuts = [
            {
                key: '/',
                description: 'Focus search',
                category: 'global' as const,
                action: () => {
                    const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
                    if (searchInput) {
                        searchInput.focus();
                    }
                }
            },
            {
                key: 'n',
                description: 'Create new post',
                category: 'global' as const,
                action: () => {
                    const createButton = document.querySelector('[aria-label="Create post"]') as HTMLButtonElement;
                    if (createButton) {
                        createButton.click();
                    }
                }
            },
            {
                key: 'h',
                ctrl: false,
                description: 'Go to home',
                category: 'navigation' as const,
                action: () => router.push('/')
            },
            {
                key: 'm',
                description: 'Go to messages',
                category: 'navigation' as const,
                action: () => router.push('/messages')
            },
            {
                key: 'p',
                description: 'Go to profile',
                category: 'navigation' as const,
                action: () => router.push('/profile')
            },
            {
                key: 'b',
                description: 'Go to bookmarks',
                category: 'navigation' as const,
                action: () => router.push('/bookmarks')
            },
        ];

        shortcuts.forEach(shortcut => registerShortcut(shortcut));

        return () => {
            shortcuts.forEach(shortcut => unregisterShortcut(shortcut.key));
        };
    }, [router, registerShortcut, unregisterShortcut]);

    return null;
}
