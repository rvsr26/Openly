"use client";

import { Award, TrendingUp, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileStatsProps {
    stats: {
        total_posts: number;
        total_views: number;
    };
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
    const items = [
        {
            label: "Total Posts",
            value: stats.total_posts,
            icon: TrendingUp,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Impact Reach",
            value: stats.total_views,
            icon: Users,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            label: "Resilience Score",
            value: "98%",
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            label: "Awards",
            value: "12",
            icon: Award,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {items.map((item, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-card p-5 flex flex-col items-center text-center hover:bg-card/80 transition-colors cursor-default"
                >
                    <div className={`p-3 rounded-2xl ${item.bg} ${item.color} mb-3`}>
                        <item.icon size={20} />
                    </div>
                    <span className="text-2xl font-black text-foreground tracking-tight">
                        {item.value}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}
