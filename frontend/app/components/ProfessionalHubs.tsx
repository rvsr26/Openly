"use client";

import { motion } from "framer-motion";
import {
    Code,
    Briefcase,
    Stethoscope,
    GraduationCap,
    Scale,
    BarChart3,
    Cpu,
    BookOpen,
    Search,
    Plus,
    Check
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { toast } from "sonner";

const HUBS = [
    { name: "Technology", icon: Code, color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Business", icon: Briefcase, color: "text-amber-400", bg: "bg-amber-400/10" },
    { name: "Medical", icon: Stethoscope, color: "text-red-400", bg: "bg-red-400/10" },
    { name: "Education", icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { name: "Legal", icon: Scale, color: "text-purple-400", bg: "bg-purple-400/10" },
    { name: "Finance", icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { name: "Engineering", icon: Cpu, color: "text-orange-400", bg: "bg-orange-400/10" },
    { name: "Academic", icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-400/10" },
];

export default function ProfessionalHubs() {
    const [search, setSearch] = useState("");
    const { user: authUser } = useAuth();

    const { data: profile, refetch } = useQuery({
        queryKey: ["userProfile", authUser?.uid],
        queryFn: async () => {
            if (!authUser) return null;
            const res = await api.get(`/users/${authUser.uid}/profile`);
            return res.data;
        },
        enabled: !!authUser,
    });

    const followedHubs = profile?.user_info?.followed_hubs || [];

    const handleToggleHub = async (e: React.MouseEvent, hubName: string) => {
        e.preventDefault(); // Prevents navigating when clicking the join button
        if (!authUser) {
            toast.error("Please login to join a hub");
            return;
        }

        try {
            const isFollowing = followedHubs.includes(hubName);
            if (isFollowing) {
                await api.post(`/users/${authUser.uid}/hubs/${hubName}/leave`);
                toast.success(`Left ${hubName} Hub`);
            } else {
                await api.post(`/users/${authUser.uid}/hubs/${hubName}/join`);
                toast.success(`Joined ${hubName} Hub`);
            }
            refetch();
        } catch (error) {
            toast.error("Failed to update hub status");
        }
    };

    const filteredHubs = HUBS.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="card-simple p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Professional Hubs</h3>
                    <p className="text-[10px] text-muted-foreground mt-1 font-bold">Industry-specific insights</p>
                </div>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Find industry..."
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-medium"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                {filteredHubs.map((hub, idx) => {
                    const isJoined = followedHubs.includes(hub.name);
                    return (
                        <Link key={hub.name} href={`/hubs/${hub.name.toLowerCase()}`}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-all group cursor-pointer relative"
                            >
                                <div className={`w-8 h-8 rounded-xl ${hub.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                    <hub.icon className={hub.color} size={16} />
                                </div>
                                <span className="text-[11px] font-black text-foreground whitespace-nowrap">{hub.name}</span>

                                <button
                                    onClick={(e) => handleToggleHub(e, hub.name)}
                                    className={`absolute top-3 right-3 p-1 rounded-full transition-all ${isJoined
                                        ? "bg-primary text-white"
                                        : "bg-white/10 text-muted-foreground hover:bg-primary/20 hover:text-primary"
                                        }`}
                                    title={isJoined ? "Leave Hub" : "Join Hub"}
                                >
                                    {isJoined ? <Check size={10} /> : <Plus size={10} />}
                                </button>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            {filteredHubs.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-xs italic">
                    No matching hubs found.
                </div>
            )}

            <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
                Can't find yours? Request a Hub
            </button>
        </div>
    );
}
