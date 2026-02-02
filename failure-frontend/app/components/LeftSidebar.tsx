"use client";

import { User } from "firebase/auth";
import Link from "next/link";
import { UserCircle } from "lucide-react";
import { getAbsUrl } from "../lib/api";

interface LeftSidebarProps {
    user: User | null;
    username: string;
}

export default function LeftSidebar({ user, username }: LeftSidebarProps) {
    return (
        <div className="hidden md:block w-full">
            {user ? (
                <div className="glass-card group overflow-hidden sticky top-28 transition-all duration-500 mr-2">
                    <div className="h-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 transition-all group-hover:scale-105 duration-700"></div>
                    <div className="px-6 pb-6">
                        <div className="relative -mt-12 mb-4">
                            <div className="h-24 w-24 rounded-3xl bg-white dark:bg-zinc-950 p-1.5 shadow-xl transition-transform group-hover:rotate-3 duration-500">
                                <img
                                    src={getAbsUrl(user.photoURL)}
                                    alt=""
                                    className="h-full w-full rounded-2xl object-cover border-2 border-white/50 dark:border-zinc-800/50"
                                />
                            </div>
                        </div>

                        <h2 className="text-xl font-black tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                            {username ? `@${username}` : user.displayName}
                        </h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 mb-6 opacity-70">
                            {username ? user.displayName : "Contributor"}
                        </p>

                        <Link href="/profile">
                            <button className="w-full py-3 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary hover:text-primary-foreground text-primary font-bold text-xs uppercase tracking-widest shadow-sm hover:shadow-indigo-500/20 transition-all duration-300">
                                View Profile
                            </button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="glass-card p-8 sticky top-28 text-center border-dashed border-2 border-primary/20">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-3xl text-primary rotate-3 group-hover:rotate-0 transition-transform">
                            <UserCircle className="h-10 w-10" />
                        </div>
                    </div>
                    <h2 className="font-black text-lg text-foreground mb-2">JOIN THE COMMUNITY</h2>
                    <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                        Share your suggestions, review others, and grow the community together.
                    </p>
                    <Link href="/login">
                        <button className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest premium-shadow hover:brightness-110 active:scale-95 transition-all">
                            Sign In Now
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}
