"use client";

import { motion } from "framer-motion";
import { Award, Shield, User, Star, Flame } from "lucide-react";

interface PhoenixBadgeProps {
    badges: string[];
    score: number;
    size?: "sm" | "md" | "lg";
    showScore?: boolean;
}

const BADGE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    "RISING_PHOENIX": { label: "Rising Phoenix", icon: Flame, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
    "COMMUNITY_MENTOR": { label: "Community Mentor", icon: Shield, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    "VETERAN_GUIDE": { label: "Veteran Guide", icon: Star, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
    "RESILIENCE_MASTER": { label: "Resilience Master", icon: User, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
};

export default function PhoenixBadge({ badges = [], score = 0, size = "sm", showScore = true }: PhoenixBadgeProps) {
    // Determine highest badge to display if multiple (logic: last one in list is highest based on backend logic)
    const highestBadgeId = badges.length > 0 ? badges[badges.length - 1] : null;
    const badge = highestBadgeId ? BADGE_CONFIG[highestBadgeId] : null;

    const sizeClasses = {
        sm: "text-[10px] px-2 py-0.5 gap-1",
        md: "text-xs px-3 py-1 gap-1.5",
        lg: "text-sm px-4 py-1.5 gap-2",
    };

    const iconSizes = {
        sm: 12,
        md: 14,
        lg: 16,
    };

    if (!badge && !showScore) return null;

    return (
        <div className="flex items-center gap-2">
            {badge && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center rounded-full font-black uppercase tracking-wider border ${badge.color} ${sizeClasses[size]}`}
                >
                    <badge.icon size={iconSizes[size]} className="shrink-0" />
                    <span>{badge.label}</span>
                </motion.div>
            )}

            {showScore && (
                <div className={`flex items-center gap-1 font-mono font-bold text-muted-foreground ${size === 'lg' ? 'text-sm' : 'text-[10px]'}`}>
                    <span>{score}</span>
                    <span className="text-primary">XP</span>
                </div>
            )}
        </div>
    );
}
