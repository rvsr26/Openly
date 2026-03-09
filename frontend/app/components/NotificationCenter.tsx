"use client";

import { useState, useEffect } from 'react';
import { Bell, X, Check, Heart, MessageCircle, UserPlus, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: 'like' | 'comment' | 'follow' | 'bookmark';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    priority: 'high' | 'normal' | 'low';
    groupId?: string;
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(() => [
        {
            id: '1',
            type: 'like',
            title: 'New likes',
            message: '5 people liked your post',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            read: false,
            priority: 'normal',
            groupId: 'likes-1',
        },
        {
            id: '2',
            type: 'comment',
            title: 'New comment',
            message: 'John commented on your post',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            read: false,
            priority: 'high',
        },
        {
            id: '3',
            type: 'follow',
            title: 'New follower',
            message: 'Sarah started following you',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            read: true,
            priority: 'normal',
        },
    ]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        // TODO: Fetch real notifications from API
        // api.get('/notifications').then(res => setNotifications(res.data));
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'like': return Heart;
            case 'comment': return MessageCircle;
            case 'follow': return UserPlus;
            case 'bookmark': return Bookmark;
        }
    };

    const filteredNotifications = notifications.filter(n =>
        filter === 'all' || !n.read
    );

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative btn-icon"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-bold text-foreground">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter('unread')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'unread'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                    >
                                        Unread ({unreadCount})
                                    </button>
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {filteredNotifications.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {filteredNotifications.map((notification) => {
                                            const Icon = getIcon(notification.type);
                                            return (
                                                <div
                                                    key={notification.id}
                                                    className={`p-4 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''
                                                        }`}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`p-2 rounded-lg ${notification.type === 'like' ? 'bg-red-500/10 text-red-500' :
                                                            notification.type === 'comment' ? 'bg-blue-500/10 text-blue-500' :
                                                                notification.type === 'follow' ? 'bg-green-500/10 text-green-500' :
                                                                    'bg-yellow-500/10 text-yellow-500'
                                                            }`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-foreground">
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                                            </p>
                                                        </div>

                                                        <div className="flex gap-1">
                                                            {!notification.read && (
                                                                <button
                                                                    onClick={() => markAsRead(notification.id)}
                                                                    className="btn-icon"
                                                                    title="Mark as read"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => deleteNotification(notification.id)}
                                                                className="btn-icon"
                                                                title="Delete"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                                        <p className="text-sm text-muted-foreground">No notifications</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
