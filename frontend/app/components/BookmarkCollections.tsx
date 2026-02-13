"use client";

import { useState, useEffect } from 'react';
import { Bookmark, Folder, Plus, Check, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/api';
import CreateCollection from './CreateCollection';

interface Collection {
    id: string;
    name: string;
    description?: string;
    count: number;
}

interface BookmarkCollectionsProps {
    postId: string;
    isBookmarked?: boolean;
    onBookmarkChange?: (bookmarked: boolean) => void;
}

export default function BookmarkCollections({
    postId,
    isBookmarked = false,
    onBookmarkChange
}: BookmarkCollectionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCollections();
        }
    }, [isOpen]);

    const fetchCollections = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            // const res = await api.get('/bookmarks/collections');
            // setCollections(res.data);

            // Mock data
            const mockCollections: Collection[] = [
                { id: '1', name: 'Career Advice', count: 12 },
                { id: '2', name: 'Tech Tips', count: 8 },
                { id: '3', name: 'Inspiration', count: 15 },
            ];
            setCollections(mockCollections);
        } catch (error) {
            toast.error('Failed to load collections');
        } finally {
            setLoading(false);
        }
    };

    const toggleCollection = async (collectionId: string) => {
        const newSelected = new Set(selectedCollections);

        if (newSelected.has(collectionId)) {
            newSelected.delete(collectionId);
        } else {
            newSelected.add(collectionId);
        }

        setSelectedCollections(newSelected);

        try {
            // TODO: Replace with actual API call
            // await api.post(`/bookmarks/collections/${collectionId}/posts`, { postId });

            // Update bookmark status
            if (newSelected.size > 0 && !isBookmarked) {
                onBookmarkChange?.(true);
            } else if (newSelected.size === 0 && isBookmarked) {
                onBookmarkChange?.(false);
            }
        } catch (error) {
            // Rollback on error
            setSelectedCollections(selectedCollections);
            toast.error('Failed to update collection');
        }
    };

    const handleQuickBookmark = async () => {
        if (isBookmarked) {
            // Remove bookmark
            try {
                // TODO: API call to remove bookmark
                onBookmarkChange?.(false);
                toast.success('Bookmark removed');
            } catch (error) {
                toast.error('Failed to remove bookmark');
            }
        } else {
            // Quick bookmark to default collection
            setIsOpen(true);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleQuickBookmark}
                className={`btn-icon ${isBookmarked ? 'text-primary' : ''}`}
                aria-label="Bookmark"
            >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-foreground">Save to Collection</h3>
                                    <CreateCollection onCollectionCreated={(c) => setCollections([...collections, c])} />
                                </div>
                            </div>

                            {/* Collections List */}
                            <div className="max-h-80 overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                                    </div>
                                ) : collections.length > 0 ? (
                                    <div className="p-2">
                                        {collections.map((collection) => (
                                            <button
                                                key={collection.id}
                                                onClick={() => toggleCollection(collection.id)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                                            >
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedCollections.has(collection.id)
                                                        ? 'bg-primary border-primary'
                                                        : 'border-border'
                                                    }`}>
                                                    {selectedCollections.has(collection.id) && (
                                                        <Check className="w-3 h-3 text-primary-foreground" />
                                                    )}
                                                </div>

                                                <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {collection.name}
                                                    </p>
                                                    {collection.description && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {collection.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <span className="text-xs text-muted-foreground">
                                                    {collection.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <Folder className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                                        <p className="text-sm text-muted-foreground mb-3">No collections yet</p>
                                        <CreateCollection onCollectionCreated={(c) => setCollections([c])} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
