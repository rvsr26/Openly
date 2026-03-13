"use client";

import { User } from "firebase/auth";
import Link from "next/link";
import {
    LayoutGrid, Bookmark,
    PenTool, MessageCircle, Users, Settings,
    HelpCircle, UserPlus, Cpu, Plus, ChevronRight, Globe, Lock, BarChart3
} from "lucide-react";
import { getAbsUrl } from "../lib/api";
import { memo } from "react";
import { usePathname } from "next/navigation";
import ProfessionalHubs from "./ProfessionalHubs";
import AIAssistant from "./AIAssistant";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

interface LeftSidebarProps {
    user: any | null;
    username: string;
    userPhoto?: string;
}

const NavItem = ({ href, icon: Icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) => (
    <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group ${active
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
    >
        <Icon size={17} className={`shrink-0 ${active ? "text-white" : "group-hover:text-primary transition-colors"}`} />
        <span>{label}</span>
    </Link>
);

function LeftSidebar({ user, username, userPhoto }: LeftSidebarProps) {
    const pathname = usePathname();
    const { user: authUser } = useAuth();

    // Fetch user's communities
    const { data: communitiesData } = useQuery({
        queryKey: ["userCommunities", authUser?.uid],
        queryFn: async () => {
            if (!authUser) return { communities: [] };
            const res = await api.get(`/api/v1/users/${authUser.uid}/communities`);
            return res.data;
        },
        enabled: !!authUser,
        staleTime: 60000,
    });

    const myCommunities: any[] = communitiesData?.communities?.slice(0, 5) || [];

    return (
        <div className="w-full flex flex-col gap-6">

            {/* ── PROFILE MINI CARD ─────────────────────────── */}
            <div className="rounded-3xl border border-white/8 bg-white/3 p-5 flex flex-col items-center text-center gap-3">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-primary/30 shadow-xl">
                        <img
                            src={user ? getAbsUrl(userPhoto || user.photoURL) : "/assets/default_avatar.png"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => { if (!e.currentTarget.src.includes("default_avatar")) e.currentTarget.src = "/assets/default_avatar.png"; }}
                        />
                    </div>
                    {user && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full" />}
                </div>
                <div>
                    <p className="font-black text-sm text-foreground">{user ? (username || user.displayName || "User") : "Guest"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {user ? `@${username || "user"}` : "Not signed in"}
                    </p>
                </div>
                {user ? (
                    <Link href="/profile" className="w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all">
                        View Profile
                    </Link>
                ) : (
                    <Link href="/login" className="w-full py-2 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-110 transition-all">
                        Sign In
                    </Link>
                )}
            </div>

            {/* AI ASSISTANT */}
            <AIAssistant />

            {/* ── YOUR COMMUNITIES ──────────────────────────── */}
            <div className="rounded-3xl border border-white/8 bg-white/3 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Users size={12} className="text-primary" /> Communities
                    </h3>
                    <Link
                        href="/communities/create"
                        className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        title="Create Community"
                    >
                        <Plus size={13} />
                    </Link>
                </div>

                {myCommunities.length > 0 ? (
                    <div className="space-y-1">
                        {myCommunities.map((community: any) => (
                            <Link
                                key={community.id}
                                href={`/communities/${community.slug}`}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all group ${pathname === `/communities/${community.slug}`
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    }`}
                            >
                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                                    {community.icon_url
                                        ? <img src={getAbsUrl(community.icon_url)} className="w-full h-full object-cover" alt={community.name} />
                                        : <span className="font-black text-primary text-xs">{community.name.charAt(0)}</span>
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{community.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{community.member_count} members</p>
                                </div>
                                {community.privacy === "private"
                                    ? <Lock size={9} className="text-muted-foreground flex-shrink-0" />
                                    : <Globe size={9} className="text-muted-foreground flex-shrink-0" />
                                }
                            </Link>
                        ))}

                        <Link
                            href="/communities"
                            className="flex items-center justify-center gap-1.5 mt-2 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                        >
                            See all communities <ChevronRight size={11} />
                        </Link>
                    </div>
                ) : (
                    <div className="text-center py-3">
                        <p className="text-xs text-muted-foreground mb-2">No communities yet</p>
                        <Link
                            href="/communities"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                        >
                            <Users size={10} /> Discover
                        </Link>
                    </div>
                )}
            </div>

            {/* ── PROFESSIONAL HUBS ─────────────────────────── */}
            <div className="mt-2">
                <ProfessionalHubs />
            </div>

            {/* ── FOOTER LINKS ──────────────────────────────── */}
            <div className="flex flex-col gap-1 mt-auto pt-4 border-t border-white/5">
                <NavItem href="/settings" icon={Settings} label="Settings" active={pathname === "/settings"} />
                <NavItem href="/help" icon={HelpCircle} label="Help Center" active={pathname === "/help"} />
            </div>

        </div>
    );
}

export default memo(LeftSidebar);

