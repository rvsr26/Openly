"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "../lib/api";

import { TrendingUp, PlusCircle, UserCircle } from "lucide-react";
import Link from "next/link";
import { User } from "firebase/auth";
import { motion } from "framer-motion";
import { getAbsUrl } from "../lib/api";
import CreatePost from "./CreatePost";

interface TrendingTopic {
    topic: string;
    posts_count: number;
}

interface RightSidebarProps {
    user: User | null;
    content: string;
    setContent: (val: string) => void;
    isAnonymous: boolean;
    setIsAnonymous: (val: boolean) => void;
    handleSubmit: () => void;
    loading: boolean;
}

interface RightSidebarProps {
    user: User | null;
    content: string;
    setContent: (val: string) => void;
    isAnonymous: boolean;
    setIsAnonymous: (val: boolean) => void;
    handleSubmit: () => void;
    loading: boolean;
}

export default function RightSidebar({
    user,
    content,
    setContent,
    isAnonymous,
    setIsAnonymous,
    handleSubmit,
    loading
}: RightSidebarProps) {

    const { data: trending = [], isLoading } = useQuery<TrendingTopic[]>({
        queryKey: ["trending"],
        queryFn: async () => {
            const res = await api.get("/stats/trending");
            return res.data;
        },
        staleTime: 1000 * 60 * 5 // 5 mins
    });

    return (
        <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="glass-card p-6 sticky top-28 group transition-all duration-500">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-foreground flex items-center gap-2">
                    <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-500">
                        <TrendingUp size={16} />
                    </div>
                    <span className="text-gradient">Top Insights</span>
                </h3>

                {isLoading ? (
                    <div className="space-y-6 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i}>
                                <div className="h-2 w-1/3 bg-primary/5 rounded-full mb-3"></div>
                                <div className="h-4 w-full bg-primary/10 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {trending.length === 0 && <p className="text-muted-foreground text-xs font-medium">No trending topics yet.</p>}

                        {trending.map((item) => (
                            <Link
                                key={item.topic}
                                href={`/?category=${item.topic}`}
                                className="group/item flex flex-col p-3 rounded-2xl hover:bg-primary/5 transition-all duration-300"
                            >
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-60">
                                    {item.topic}
                                </span>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-foreground group-hover/item:text-primary transition-colors">
                                        #{item.topic}
                                    </span>
                                    <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-lg">
                                        {item.posts_count}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </ul>
                )}
            </div>

            {/* CREATE POST BOX IN SIDEBAR */}
            <CreatePost
                user={user}
                content={content}
                setContent={setContent}
                isAnonymous={isAnonymous}
                setIsAnonymous={setIsAnonymous}
                handleSubmit={handleSubmit}
                loading={loading}
            />
        </div>
    );
}
