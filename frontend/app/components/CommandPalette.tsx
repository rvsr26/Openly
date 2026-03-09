"use client";

import { useState, useEffect, useCallback } from 'react';
import { Command, Search, Home, User, Settings, FileText, Hash, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
    id: string;
    label: string;
    icon: any;
    action: () => void;
    category: 'navigation' | 'actions' | 'search';
    keywords?: string[];
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    const commands: CommandItem[] = [
        // Navigation
        { id: 'home', label: 'Go to Home', icon: Home, action: () => router.push('/'), category: 'navigation' },
        { id: 'profile', label: 'Go to Profile', icon: User, action: () => router.push('/profile'), category: 'navigation' },
        { id: 'settings', label: 'Go to Settings', icon: Settings, action: () => router.push('/settings'), category: 'navigation' },
        { id: 'bookmarks', label: 'Go to Bookmarks', icon: FileText, action: () => router.push('/bookmarks'), category: 'navigation' },
        { id: 'trending', label: 'View Trending', icon: TrendingUp, action: () => router.push('/trending'), category: 'navigation' },

        // Actions
        {
            id: 'new-post', label: 'Create New Post', icon: FileText, action: () => {
                router.push('/');
                setTimeout(() => (document.querySelector('[data-create-post]') as HTMLElement)?.click(), 100);
            }, category: 'actions', keywords: ['create', 'write', 'post']
        },

        { id: 'search', label: 'Search Posts', icon: Search, action: () => router.push('/search'), category: 'actions', keywords: ['find', 'search'] },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords?.some(k => k.includes(query.toLowerCase()))
    );

    const executeCommand = (command: CommandItem) => {
        command.action();
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K or Cmd+K to open
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }

            if (!isOpen) return;

            // Escape to close
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                setSelectedIndex(0);
            }

            // Arrow navigation
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            }

            // Enter to execute
            if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
                e.preventDefault();
                executeCommand(filteredCommands[selectedIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredCommands]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Command Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101]"
                    >
                        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden mx-4">
                            {/* Search Input */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                                <Search className="w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setSelectedIndex(0);
                                    }}
                                    placeholder="Type a command or search..."
                                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                                    autoFocus
                                />
                                <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded">
                                    ESC
                                </kbd>
                            </div>

                            {/* Commands List */}
                            <div className="max-h-96 overflow-y-auto p-2">
                                {filteredCommands.length > 0 ? (
                                    <div className="space-y-1">
                                        {filteredCommands.map((command, index) => {
                                            const Icon = command.icon;
                                            return (
                                                <button
                                                    key={command.id}
                                                    onClick={() => executeCommand(command)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${index === selectedIndex
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'hover:bg-muted text-foreground'
                                                        }`}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span className="flex-1 text-left text-sm font-medium">{command.label}</span>
                                                    {index === selectedIndex && (
                                                        <kbd className="px-2 py-1 text-xs font-semibold bg-primary/20 rounded">
                                                            ↵
                                                        </kbd>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                                        <p className="text-sm text-muted-foreground">No commands found</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-muted rounded">↑</kbd>
                                        <kbd className="px-1.5 py-0.5 bg-muted rounded">↓</kbd>
                                        Navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd>
                                        Select
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    Press <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+K</kbd> to toggle
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
