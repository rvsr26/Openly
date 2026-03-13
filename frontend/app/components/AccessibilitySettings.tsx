"use client";

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Type, Contrast, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getScopedKey } from '@/app/lib/accountUtils';

interface AccessibilitySettings {
    fontSize: 'small' | 'medium' | 'large' | 'x-large';
    highContrast: boolean;
    reduceMotion: boolean;
    screenReaderOptimized: boolean;
}

export default function AccessibilitySettings() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<AccessibilitySettings>({
        fontSize: 'medium',
        highContrast: false,
        reduceMotion: false,
        screenReaderOptimized: false,
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(getScopedKey('accessibility_settings', user?.uid));
            if (saved) setSettings(JSON.parse(saved));
        }
    }, [user?.uid]);

    const applySettings = (newSettings: AccessibilitySettings) => {
        if (typeof window === 'undefined') return;
        const root = document.documentElement;

        // Font size
        root.setAttribute('data-font-size', newSettings.fontSize);

        // High contrast
        if (newSettings.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Reduce motion
        if (newSettings.reduceMotion) {
            root.classList.add('reduce-motion');
        } else {
            root.classList.remove('reduce-motion');
        }

        // Screen reader
        if (newSettings.screenReaderOptimized) {
            root.setAttribute('data-screen-reader', 'true');
        } else {
            root.removeAttribute('data-screen-reader');
        }
    };

    useEffect(() => {
        applySettings(settings);
    }, [settings]);

    const updateSettings = (updates: Partial<AccessibilitySettings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        localStorage.setItem(getScopedKey('accessibility_settings', user?.uid), JSON.stringify(newSettings));
        applySettings(newSettings);
        toast.success('Accessibility settings updated');
    };

    return (
        <div className="space-y-6">
            {/* Font Size */}
            <div className="card-simple p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Type className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Font Size</h3>
                        <p className="text-xs text-muted-foreground">Adjust text size for better readability</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {(['small', 'medium', 'large', 'x-large'] as const).map((size) => (
                        <button
                            key={size}
                            onClick={() => updateSettings({ fontSize: size })}
                            className={`p-3 rounded-lg border transition-all ${settings.fontSize === size
                                ? 'bg-primary/10 border-primary'
                                : 'bg-muted/30 border-border hover:bg-muted/50'
                                }`}
                        >
                            <span className={`font-medium ${size === 'small' ? 'text-xs' :
                                size === 'medium' ? 'text-sm' :
                                    size === 'large' ? 'text-base' :
                                        'text-lg'
                                }`}>
                                {size === 'x-large' ? 'XL' : size.charAt(0).toUpperCase()}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* High Contrast */}
            <div className="card-simple p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Contrast className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">High Contrast Mode</h3>
                            <p className="text-xs text-muted-foreground">Increase color contrast for better visibility</p>
                        </div>
                    </div>
                    <button
                        onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.highContrast ? 'bg-primary' : 'bg-muted'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.highContrast ? 'translate-x-6' : ''
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Reduce Motion */}
            <div className="card-simple p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Reduce Motion</h3>
                            <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
                        </div>
                    </div>
                    <button
                        onClick={() => updateSettings({ reduceMotion: !settings.reduceMotion })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.reduceMotion ? 'bg-primary' : 'bg-muted'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.reduceMotion ? 'translate-x-6' : ''
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Screen Reader */}
            <div className="card-simple p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Eye className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Screen Reader Optimization</h3>
                            <p className="text-xs text-muted-foreground">Enhanced labels and descriptions</p>
                        </div>
                    </div>
                    <button
                        onClick={() => updateSettings({ screenReaderOptimized: !settings.screenReaderOptimized })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings.screenReaderOptimized ? 'bg-primary' : 'bg-muted'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.screenReaderOptimized ? 'translate-x-6' : ''
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Reset */}
            <button
                onClick={() => {
                    const defaults: AccessibilitySettings = {
                        fontSize: 'medium',
                        highContrast: false,
                        reduceMotion: false,
                        screenReaderOptimized: false,
                    };
                    updateSettings(defaults);
                }}
                className="w-full btn-secondary"
            >
                Reset to Defaults
            </button>
        </div>
    );
}
