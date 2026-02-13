"use client";

import { useState, useEffect } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/api';

interface FeedPreference {
    contentTypes: string[];
    topics: string[];
    sortBy: 'hot' | 'new' | 'top';
}

const CONTENT_TYPES = [
    { id: 'posts', label: 'Text Posts', icon: '📝' },
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'polls', label: 'Polls', icon: '📊' },
    { id: 'links', label: 'Links', icon: '🔗' },
];

const SORT_OPTIONS = [
    { id: 'hot', label: 'Hot', description: 'Trending posts' },
    { id: 'new', label: 'New', description: 'Latest posts' },
    { id: 'top', label: 'Top', description: 'Most popular' },
];

export default function FeedPreferences() {
    const [isOpen, setIsOpen] = useState(false);
    const [preferences, setPreferences] = useState<FeedPreference>({
        contentTypes: ['posts', 'images', 'polls', 'links'],
        topics: [],
        sortBy: 'hot',
    });
    const [availableTopics, setAvailableTopics] = useState<string[]>([
        'Career', 'Startup', 'Technology', 'Life Lessons', 'Failure Stories', 'Growth'
    ]);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = () => {
        const saved = localStorage.getItem('feed_preferences');
        if (saved) {
            setPreferences(JSON.parse(saved));
        }
    };

    const savePreferences = async (newPrefs: FeedPreference) => {
        setPreferences(newPrefs);
        localStorage.setItem('feed_preferences', JSON.stringify(newPrefs));

        try {
            // TODO: Save to backend
            // await api.post('/users/preferences', { feed: newPrefs });
            toast.success('Preferences saved!');
        } catch (error) {
            toast.error('Failed to save preferences');
        }
    };

    const toggleContentType = (typeId: string) => {
        const newTypes = preferences.contentTypes.includes(typeId)
            ? preferences.contentTypes.filter(t => t !== typeId)
            : [...preferences.contentTypes, typeId];

        if (newTypes.length === 0) {
            toast.error('Select at least one content type');
            return;
        }

        savePreferences({ ...preferences, contentTypes: newTypes });
    };

    const toggleTopic = (topic: string) => {
        const newTopics = preferences.topics.includes(topic)
            ? preferences.topics.filter(t => t !== topic)
            : [...preferences.topics, topic];

        savePreferences({ ...preferences, topics: newTopics });
    };

    const changeSortBy = (sortBy: 'hot' | 'new' | 'top') => {
        savePreferences({ ...preferences, sortBy });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-secondary text-sm"
            >
                <Filter className="w-4 h-4" />
                Customize Feed
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: 300 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto z-50"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Filter className="w-5 h-5 text-primary" />
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground">Feed Preferences</h2>
                                    </div>
                                    <button onClick={() => setIsOpen(false)} className="btn-icon">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Sort By */}
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3">Sort By</h3>
                                    <div className="space-y-2">
                                        {SORT_OPTIONS.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => changeSortBy(option.id as any)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${preferences.sortBy === option.id
                                                        ? 'bg-primary/10 border-primary'
                                                        : 'bg-muted/30 border-border hover:bg-muted/50'
                                                    }`}
                                            >
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-foreground">{option.label}</p>
                                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                                </div>
                                                {preferences.sortBy === option.id && (
                                                    <Check className="w-5 h-5 text-primary" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Content Types */}
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3">Content Types</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CONTENT_TYPES.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => toggleContentType(type.id)}
                                                className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${preferences.contentTypes.includes(type.id)
                                                        ? 'bg-primary/10 border-primary'
                                                        : 'bg-muted/30 border-border hover:bg-muted/50'
                                                    }`}
                                            >
                                                <span className="text-xl">{type.icon}</span>
                                                <span className="text-sm font-medium text-foreground">{type.label}</span>
                                                {preferences.contentTypes.includes(type.id) && (
                                                    <Check className="w-4 h-4 text-primary ml-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Topics */}
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3">
                                        Filter by Topics {preferences.topics.length > 0 && `(${preferences.topics.length})`}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Leave empty to see all topics
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {availableTopics.map((topic) => (
                                            <button
                                                key={topic}
                                                onClick={() => toggleTopic(topic)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${preferences.topics.includes(topic)
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                    }`}
                                            >
                                                {topic}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reset */}
                                <button
                                    onClick={() => {
                                        const defaultPrefs: FeedPreference = {
                                            contentTypes: ['posts', 'images', 'polls', 'links'],
                                            topics: [],
                                            sortBy: 'hot',
                                        };
                                        savePreferences(defaultPrefs);
                                    }}
                                    className="w-full btn-secondary"
                                >
                                    Reset to Defaults
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
