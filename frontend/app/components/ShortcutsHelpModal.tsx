"use client";

import { useKeyboardShortcuts } from '@/context/KeyboardShortcutsContext';
import { X, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShortcutsHelpModal() {
    const { shortcuts, showHelp, setShowHelp } = useKeyboardShortcuts();

    const categories = {
        global: shortcuts.filter(s => s.category === 'global'),
        navigation: shortcuts.filter(s => s.category === 'navigation'),
        actions: shortcuts.filter(s => s.category === 'actions'),
    };

    const formatKey = (shortcut: any) => {
        const keys = [];
        if (shortcut.ctrl) keys.push('Ctrl');
        if (shortcut.shift) keys.push('Shift');
        if (shortcut.alt) keys.push('Alt');
        keys.push(shortcut.key.toUpperCase());
        return keys.join(' + ');
    };

    return (
        <AnimatePresence>
            {showHelp && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={() => setShowHelp(false)}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Keyboard className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
                                    <p className="text-xs text-muted-foreground">Navigate faster with these shortcuts</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="btn-icon"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[calc(80vh-88px)] p-6">
                            {/* Global Shortcuts */}
                            {categories.global.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-foreground mb-3">Global</h3>
                                    <div className="space-y-2">
                                        {categories.global.map((shortcut, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                                <span className="text-sm text-foreground">{shortcut.description}</span>
                                                <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono text-muted-foreground">
                                                    {formatKey(shortcut)}
                                                </kbd>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Navigation Shortcuts */}
                            {categories.navigation.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-foreground mb-3">Navigation</h3>
                                    <div className="space-y-2">
                                        {categories.navigation.map((shortcut, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                                <span className="text-sm text-foreground">{shortcut.description}</span>
                                                <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono text-muted-foreground">
                                                    {formatKey(shortcut)}
                                                </kbd>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Shortcuts */}
                            {categories.actions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3">Actions</h3>
                                    <div className="space-y-2">
                                        {categories.actions.map((shortcut, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                                <span className="text-sm text-foreground">{shortcut.description}</span>
                                                <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono text-muted-foreground">
                                                    {formatKey(shortcut)}
                                                </kbd>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border bg-muted/30">
                            <p className="text-xs text-center text-muted-foreground">
                                Press <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">?</kbd> anytime to toggle this help
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
