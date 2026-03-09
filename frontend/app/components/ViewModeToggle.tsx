"use client";

import { useState, useEffect } from 'react';
import { LayoutGrid, LayoutList, Maximize2, Minimize2 } from 'lucide-react';

type ViewMode = 'compact' | 'comfortable' | 'spacious' | 'grid';

interface ViewModeToggleProps {
    onViewModeChange?: (mode: ViewMode) => void;
}

export default function ViewModeToggle({ onViewModeChange }: ViewModeToggleProps) {
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('view_mode');
            if (saved) return saved as ViewMode;
        }
        return 'comfortable';
    });

    const applyViewMode = (mode: ViewMode) => {
        if (typeof window === 'undefined') return;
        document.documentElement.setAttribute('data-view-mode', mode);
    };

    useEffect(() => {
        applyViewMode(viewMode);
    }, [viewMode]);

    const changeViewMode = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('view_mode', mode);
        applyViewMode(mode);
        onViewModeChange?.(mode);
    };

    const modes = [
        { id: 'compact', icon: Minimize2, label: 'Compact', description: 'More posts' },
        { id: 'comfortable', icon: LayoutList, label: 'Comfortable', description: 'Default' },
        { id: 'spacious', icon: Maximize2, label: 'Spacious', description: 'Larger cards' },
        { id: 'grid', icon: LayoutGrid, label: 'Grid', description: 'Image grid' },
    ] as const;

    return (
        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg">
            {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                    <button
                        key={mode.id}
                        onClick={() => changeViewMode(mode.id)}
                        className={`p-2 rounded-md transition-all ${viewMode === mode.id
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                        title={`${mode.label} - ${mode.description}`}
                    >
                        <Icon className="w-4 h-4" />
                    </button>
                );
            })}
        </div>
    );
}
