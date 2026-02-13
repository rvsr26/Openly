"use client";

import { User } from "firebase/auth";
import Link from "next/link";
import { UserCircle, LayoutGrid, Flame, Trophy, Compass, Bookmark, FileText, Settings, HelpCircle, Layers, PenTool, Home, MessageCircle, UserPlus, Users } from "lucide-react";
import { getAbsUrl } from "../lib/api";
import { memo } from "react";
import { motion } from "framer-motion";
import SpotlightCard from "./ui/SpotlightCard";

interface LeftSidebarProps {
    user: any | null;
    username: string;
    userPhoto?: string;
}

const NavItem = ({ href, icon: Icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) => (
    <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${active ? "bg-primary text-white premium-shadow" : "text-muted-foreground hover:bg-white/10 hover:text-primary dark:hover:bg-white/5"}`}>
        <div className={`absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${active ? "hidden" : ""}`}></div>
        <Icon size={18} className={`relative z-10 ${active ? "text-white" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
        <span className="relative z-10 text-sm font-bold tracking-wide">{label}</span>
    </Link>
);

function LeftSidebar({ user, username, userPhoto }: LeftSidebarProps) {

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full space-y-6"
        >

            {/* 1. PROFILE CARD */}
            <motion.div variants={itemVariants}>
                <SpotlightCard className="p-6 relative overflow-hidden group premium-shadow border-none bg-card/60 dark:bg-card/40" spotlightColor="rgba(var(--primary), 0.15)">
                    {/* Background Decor */}
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent z-0"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="relative mb-4 group-hover:scale-105 transition-transform duration-500">
                            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[hsl(var(--gradient-1))] to-[hsl(var(--gradient-2))] shadow-xl">
                                <img
                                    src={user ? getAbsUrl(userPhoto || user.photoURL) : "/assets/anonymous.png"}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover border-4 border-card"
                                />
                            </div>
                            {user && <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-card rounded-full shadow-sm"></div>}
                        </div>

                        <h2 className="text-lg font-black text-foreground tracking-tight mb-1">
                            {user ? (username || user.displayName || "User") : "Guest User"}
                        </h2>
                        <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-5 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                            {user ? "Verified Member" : "Explorer"}
                        </p>

                        {user ? (
                            <div className="w-full flex justify-center gap-4 text-xs font-semibold text-muted-foreground mb-2">
                                <div className="flex flex-col items-center">
                                    <span className="text-foreground font-bold text-sm">12</span>
                                    <span className="text-[10px] uppercase">Posts</span>
                                </div>
                                <div className="w-[1px] h-8 bg-border/50"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-foreground font-bold text-sm">450</span>
                                    <span className="text-[10px] uppercase">Karma</span>
                                </div>
                            </div>
                        ) : (
                            <Link href="/login" className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 hover:shadow-lg hover:shadow-primary/30 transition-all">
                                Sign In
                            </Link>
                        )}

                    </div>
                </SpotlightCard>
            </motion.div>

            {/* 2. MAIN NAVIGATION */}
            <motion.div variants={itemVariants}>
                <div className="glass-card p-3 space-y-1 bg-card/50 dark:bg-card/30 backdrop-blur-md">
                    <p className="px-3 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2 mt-2 ml-1">Personal</p>
                    <NavItem href="/profile" icon={LayoutGrid} label="My Reviews" />
                    <NavItem href="/messages" icon={MessageCircle} label="Messages" />
                    <NavItem href="/network" icon={Users} label="My Network" />
                    <NavItem href="/drafts" icon={PenTool} label="Drafts" />
                    <NavItem href="/bookmarks" icon={Bookmark} label="Bookmarks" />
                </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                <div className="glass-card p-3 space-y-1 bg-card/50 dark:bg-card/30 backdrop-blur-md">
                    <p className="px-3 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2 mt-2 ml-1">Explore</p>
                    <NavItem href="/" icon={Home} label="Home" active />
                    <NavItem href="/?sort=hot" icon={Flame} label="Hot" />
                    <NavItem href="/?sort=top" icon={Trophy} label="Top Rated" />
                    <NavItem href="/categories" icon={Layers} label="Categories" />
                </div>
            </motion.div>

            {/* 3. SETTINGS & HELP */}
            <motion.div variants={itemVariants} className="px-2 pt-2">
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors group">
                    <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                    <span className="text-xs font-bold">Settings</span>
                </Link>
                <Link href="/help" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors group">
                    <HelpCircle size={16} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs font-bold">Help Center</span>
                </Link>
            </motion.div>

        </motion.div>
    );
}

export default memo(LeftSidebar);
