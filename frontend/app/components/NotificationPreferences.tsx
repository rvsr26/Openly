"use client";

import { useState, useEffect } from 'react';
import { Bell, Mail, Volume2, VolumeX, Clock, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getScopedKey } from '@/app/lib/accountUtils';

const NotificationToggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'
            }`}
    >
        <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : ''
                }`}
        />
    </button>
);
import api from '../lib/api';

interface NotificationPreferences {
    email: {
        newFollower: boolean;
        newComment: boolean;
        newLike: boolean;
        newMessage: boolean;
        weeklyDigest: boolean;
    };
    push: {
        newFollower: boolean;
        newComment: boolean;
        newLike: boolean;
        newMessage: boolean;
    };
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
    };
    mutedUsers: string[];
    mutedTopics: string[];
}

export default function NotificationPreferences() {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        email: {
            newFollower: true,
            newComment: true,
            newLike: false,
            newMessage: true,
            weeklyDigest: true,
        },
        push: {
            newFollower: true,
            newComment: true,
            newLike: false,
            newMessage: true,
        },
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
        },
        mutedUsers: [],
        mutedTopics: [],
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(getScopedKey('notification_preferences', user?.uid));
            if (saved) setPreferences(JSON.parse(saved));
        }
    }, [user?.uid]);

    useEffect(() => {
        // Asynchronous loading from backend can still be initiated here
    }, []);

    const savePreferences = async (newPrefs: NotificationPreferences) => {
        setPreferences(newPrefs);
        localStorage.setItem(getScopedKey('notification_preferences', user?.uid), JSON.stringify(newPrefs));

        try {
            // TODO: Save to backend
            // await api.post('/users/notification-preferences', newPrefs);
            toast.success('Notification preferences updated');
        } catch (error) {
            toast.error('Failed to save preferences');
        }
    };

    const toggleEmailNotification = (key: keyof typeof preferences.email) => {
        savePreferences({
            ...preferences,
            email: { ...preferences.email, [key]: !preferences.email[key] },
        });
    };

    const togglePushNotification = (key: keyof typeof preferences.push) => {
        savePreferences({
            ...preferences,
            push: { ...preferences.push, [key]: !preferences.push[key] },
        });
    };

    const updateQuietHours = (updates: Partial<typeof preferences.quietHours>) => {
        savePreferences({
            ...preferences,
            quietHours: { ...preferences.quietHours, ...updates },
        });
    };


    return (
        <div className="space-y-6">
            {/* Email Notifications */}
            <div className="card-simple p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Email Notifications</h3>
                        <p className="text-xs text-muted-foreground">Choose what you want to receive via email</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {Object.entries(preferences.email).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-2">
                            <span className="text-sm text-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <NotificationToggle
                                enabled={value}
                                onChange={() => toggleEmailNotification(key as any)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Push Notifications */}
            <div className="card-simple p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Push Notifications</h3>
                        <p className="text-xs text-muted-foreground">Real-time notifications on your device</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {Object.entries(preferences.push).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-2">
                            <span className="text-sm text-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <NotificationToggle
                                enabled={value}
                                onChange={() => togglePushNotification(key as any)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Quiet Hours */}
            <div className="card-simple p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground">Quiet Hours</h3>
                        <p className="text-xs text-muted-foreground">Pause notifications during specific hours</p>
                    </div>
                    <NotificationToggle
                        enabled={preferences.quietHours.enabled}
                        onChange={() => updateQuietHours({ enabled: !preferences.quietHours.enabled })}
                    />
                </div>

                {preferences.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={preferences.quietHours.start}
                                onChange={(e) => updateQuietHours({ start: e.target.value })}
                                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={preferences.quietHours.end}
                                onChange={(e) => updateQuietHours({ end: e.target.value })}
                                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Muted Content */}
            <div className="card-simple p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <VolumeX className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Muted Content</h3>
                        <p className="text-xs text-muted-foreground">Hide notifications from specific users or topics</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                            Muted Users ({preferences.mutedUsers.length})
                        </label>
                        <button className="btn-secondary text-sm w-full">
                            <UserX className="w-4 h-4" />
                            Manage Muted Users
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                            Muted Topics ({preferences.mutedTopics.length})
                        </label>
                        <button className="btn-secondary text-sm w-full">
                            <VolumeX className="w-4 h-4" />
                            Manage Muted Topics
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
