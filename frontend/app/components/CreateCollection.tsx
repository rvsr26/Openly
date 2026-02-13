"use client";

import { useState } from 'react';
import { Plus, Folder, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/api';

interface CreateCollectionProps {
    onCollectionCreated?: (collection: any) => void;
}

export default function CreateCollection({ onCollectionCreated }: CreateCollectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // TODO: Replace with actual API call
            // const res = await api.post('/bookmarks/collections', { name, description });
            const newCollection = { id: Date.now().toString(), name, description, count: 0 };
            toast.success('Collection created!');
            onCollectionCreated?.(newCollection);
            setName('');
            setDescription('');
            setIsOpen(false);
        } catch (error) {
            toast.error('Failed to create collection');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-primary text-sm"
            >
                <Plus className="w-4 h-4" />
                New Collection
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

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Folder className="w-5 h-5 text-primary" />
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground">Create Collection</h2>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="btn-icon"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Collection Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., Career Advice, Tech Tips"
                                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
                                            autoFocus
                                            maxLength={50}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            Description (Optional)
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="What's this collection about?"
                                            className="w-full min-h-[80px] px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                            maxLength={200}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!name.trim() || isSubmitting}
                                            className="btn-primary"
                                        >
                                            {isSubmitting ? 'Creating...' : 'Create Collection'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
