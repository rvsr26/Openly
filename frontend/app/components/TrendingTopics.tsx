"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, Hash, User, Flame } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '../lib/api';

interface TrendingItem {
    type: 'hashtag' | 'user' | 'post';
    title: string;
    count?: number;
    subtitle?: string;
    link: string;
}

export default function TrendingTopics() {
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
    const [trending, setTrending] = useState<TrendingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrending();
    }, [timeRange]);

    const fetchTrending = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            // const res = await api.get(`/trending?range=${timeRange}`);
            // setTrending(res.data);

            // Mock data for now
            const mockData: TrendingItem[] = [
                { type: 'hashtag', title: '#CareerAdvice', count: 1234, link: '/search?q=%23CareerAdvice' },
                { type: 'hashtag', title: '#StartupLife', count: 892, link: '/search?q=%23StartupLife' },
                { type: 'hashtag', title: '#TechTips', count: 756, link: '/search?q=%23TechTips' },
                { type: 'user', title: 'John Doe', subtitle: '245 posts', link: '/u/johndoe' },
                { type: 'user', title: 'Jane Smith', subtitle: '198 posts', link: '/u/janesmith' },
            ];
            setTrending(mockData);
        } catch (error) {
            console.error('Failed to fetch trending:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card-simple p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Flame className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Trending Now</h3>
            </div>

            {/* Time Range Tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-lg mb-4">
                {(['today', 'week', 'month'] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${timeRange === range
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {range === 'today' ? 'Today' : range === 'week' ? 'Week' : 'Month'}
                    </button>
                ))}
            </div>

            {/* Trending List */}
            <div className="space-y-1">
                {loading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-lg animate-pulse">
                            <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                            <div className="h-3 w-1/2 bg-muted rounded" />
                        </div>
                    ))
                ) : trending.length > 0 ? (
                    trending.map((item, i) => (
                        <Link
                            key={i}
                            href={item.link}
                            className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className="mt-0.5">
                                    {item.type === 'hashtag' && (
                                        <Hash className="w-4 h-4 text-primary" />
                                    )}
                                    {item.type === 'user' && (
                                        <User className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    {item.type === 'post' && (
                                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                        {item.title}
                                    </p>
                                    {(item.subtitle || item.count) && (
                                        <p className="text-xs text-muted-foreground">
                                            {item.subtitle || `${item.count?.toLocaleString()} posts`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="p-6 text-center">
                        <p className="text-xs text-muted-foreground">No trending topics yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
