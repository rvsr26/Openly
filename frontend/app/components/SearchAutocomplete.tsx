"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SearchSuggestion {
    type: 'recent' | 'trending' | 'user' | 'topic';
    text: string;
    count?: number;
}

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT = 5;

export default function SearchAutocomplete() {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const recent = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (recent) return JSON.parse(recent);
        }
        return [];
    });
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Generate suggestions based on query using useMemo
    const suggestions = useMemo<SearchSuggestion[]>(() => {
        if (!query.trim()) {
            // Show recent searches when empty
            return recentSearches.map(text => ({
                type: 'recent',
                text
            }));
        } else {
            // TODO: Fetch from API
            // For now, show mock suggestions
            return [
                { type: 'trending', text: query, count: 245 },
                { type: 'topic', text: `#${query}` },
            ];
        }
    }, [query, recentSearches]);

    const saveRecentSearch = (searchText: string) => {
        const updated = [searchText, ...recentSearches.filter(s => s !== searchText)].slice(0, MAX_RECENT);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    };

    const handleSearch = (searchText: string) => {
        if (!searchText.trim()) return;

        saveRecentSearch(searchText);
        setIsOpen(false);
        setQuery('');
        router.push(`/search?q=${encodeURIComponent(searchText)}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(query);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    return (
        <div ref={containerRef} className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search posts, users, topics..."
                className="w-full bg-muted/50 hover:bg-muted/70 focus:bg-background border border-border focus:border-primary rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto"
                    >
                        {suggestions.length > 0 ? (
                            <>
                                {/* Header */}
                                {!query && recentSearches.length > 0 && (
                                    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                                        <span className="text-xs font-semibold text-muted-foreground">Recent Searches</span>
                                        <button
                                            onClick={clearRecentSearches}
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}

                                {/* Suggestions */}
                                <div className="py-2">
                                    {suggestions.map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSearch(suggestion.text)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                                        >
                                            {suggestion.type === 'recent' && (
                                                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            )}
                                            {suggestion.type === 'trending' && (
                                                <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                                            )}
                                            {suggestion.type === 'topic' && (
                                                <span className="text-primary text-sm font-bold flex-shrink-0">#</span>
                                            )}

                                            <span className="flex-1 text-sm text-foreground truncate">{suggestion.text}</span>

                                            {suggestion.count && (
                                                <span className="text-xs text-muted-foreground">{suggestion.count} posts</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm text-muted-foreground">No recent searches</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
