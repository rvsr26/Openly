"use client";

import { User } from "firebase/auth";
import Link from "next/link";
import { UserCircle, LayoutGrid, Flame, Trophy, Compass, Bookmark, FileText, Settings, HelpCircle, Layers, PenTool, Home, MessageCircle } from "lucide-react";
import { getAbsUrl } from "../lib/api";
import { memo } from "react";

interface LeftSidebarProps {
    user: User | null;
    username: string;
    userPhoto?: string;
}

const NavItem = ({ href, icon: Icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) => (
    <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? "bg-primary text-white premium-shadow" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}>
        <Icon size={18} className={active ? "text-white" : "text-muted-foreground group-hover:text-white transition-colors"} />
        <span className="text-sm font-bold tracking-wide">{label}</span>
    </Link>
);

function LeftSidebar({ user, username, userPhoto }: LeftSidebarProps) {

    return (
        <div className="w-full space-y-6">

            {/* 1. PROFILE CARD */}
            <div className="glass-card p-6 relative overflow-hidden group premium-shadow">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 z-0"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="relative mb-3 group-hover:scale-105 transition-transform duration-500">
                        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl">
                            <img
                                src={user ? getAbsUrl(userPhoto || user.photoURL) : "/assets/anonymous.png"}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover border-2 border-background"
                            />
                        </div>
                        {user && <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full"></div>}
                    </div>

                    <h2 className="text-base font-black text-foreground tracking-tight mb-0.5">
                        {user ? (username || user.displayName || "User") : "Guest User"}
                    </h2>
                    <p className="text-[9px] font-bold text-primary/70 uppercase tracking-widest mb-4">
                        {user ? "Verified Member" : "Explorer"}
                    </p>

                    {user ? (
                        <div className="w-full h-[1px] bg-border/30 mb-2"></div>
                    ) : (
                        <Link href="/login" className="w-full py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all">
                            Sign In
                        </Link>
                    )}

                </div>
            </div>

            {/* 2. MAIN NAVIGATION */}
            <div className="glass-card p-3 space-y-1">
                <p className="px-3 text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2 mt-1">Personal</p>
                <NavItem href="/profile" icon={LayoutGrid} label="My Reviews" />
                <NavItem href="/messages" icon={MessageCircle} label="Messages" />
                <NavItem href="/drafts" icon={PenTool} label="Drafts" />
                <NavItem href="/bookmarks" icon={Bookmark} label="Bookmarks" />
            </div>

            <div className="glass-card p-3 space-y-1">
                <p className="px-3 text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2 mt-1">Explore</p>
                <NavItem href="/" icon={Home} label="Home" active />
                <NavItem href="/?sort=hot" icon={Flame} label="Hot" />
                <NavItem href="/?sort=top" icon={Trophy} label="Top Rated" />
                <NavItem href="/categories" icon={Layers} label="Categories" />
            </div>

            {/* 3. SETTINGS & HELP */}
            <div className="px-2">
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-white transition-colors">
                    <Settings size={16} />
                    <span className="text-xs font-bold">Settings</span>
                </Link>
                <Link href="/help" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-white transition-colors">
                    <HelpCircle size={16} />
                    <span className="text-xs font-bold">Help Center</span>
                </Link>
            </div>

        </div>
    );
}

export default memo(LeftSidebar);
