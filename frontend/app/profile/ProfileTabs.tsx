"use client";

import { motion } from "framer-motion";

interface ProfileTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function ProfileTabs({ activeTab, setActiveTab }: ProfileTabsProps) {
    const tabs = ["Overview", "Posts", "Media", "Saved"];

    return (
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/25"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{tab}</span>
                    </button>
                );
            })}
        </div>
    );
}
