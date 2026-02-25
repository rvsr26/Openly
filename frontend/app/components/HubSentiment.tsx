"use client";

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Minus, Smile, Frown, Meh, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface HubSentimentProps {
    hubName: string;
}

export default function HubSentiment({ hubName }: HubSentimentProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['hubSentiment', hubName],
        queryFn: async () => {
            const res = await api.get(`/api/v1/hubs/${hubName}/sentiment`);
            return res.data;
        },
        refetchInterval: 300000, // Refresh every 5 minutes
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit">
                <Loader2 size={12} className="animate-spin text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Analyzing Vibe...</span>
            </div>
        );
    }

    const sentiment = (data as any)?.sentiment || 'NEUTRAL';
    const score = (data as any)?.score || 0.5;

    const config = {
        POSITIVE: {
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            icon: Smile,
            label: 'Positive Vibe',
            trend: TrendingUp
        },
        NEGATIVE: {
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            icon: Frown,
            label: 'Heated Debate',
            trend: TrendingDown
        },
        NEUTRAL: {
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            icon: Meh,
            label: 'Neutral Tone',
            trend: Minus
        }
    }[sentiment as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'] || {
        color: 'text-muted-foreground',
        bg: 'bg-white/5',
        border: 'border-white/10',
        icon: Zap,
        label: 'Analyzing',
        trend: Zap
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${config.bg} ${config.border} border shadow-lg shadow-black/5 backdrop-blur-md`}
        >
            <div className={`p-1.5 rounded-lg ${config.bg}`}>
                <config.icon size={16} className={config.color} />
            </div>

            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${config.color}`}>
                        {config.label}
                    </span>
                    <config.trend size={10} className={config.color} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score * 100}%` }}
                            className={`h-full ${config.color.replace('text', 'bg')}`}
                        />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">AI Analysis</span>
                </div>
            </div>
        </motion.div>
    );
}
