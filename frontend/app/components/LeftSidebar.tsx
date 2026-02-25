"use client";

import { User } from "firebase/auth";
import Link from "next/link";
import {
    LayoutGrid, Bookmark,
    PenTool, MessageCircle, Users, Settings,
    HelpCircle, UserPlus, Cpu
} from "lucide-react";
import { getAbsUrl } from "../lib/api";
import { memo } from "react";
import { usePathname } from "next/navigation";
import ProfessionalHubs from "./ProfessionalHubs";

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
