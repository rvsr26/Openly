"use client";

import { User } from "firebase/auth";
import { getAbsUrl } from "../lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { Edit, Share2, MapPin, Calendar, Link as LinkIcon } from "lucide-react";

interface ProfileHeaderProps {
    user: User;
    profileData: any;
    isOwner: boolean;
}

export default function ProfileHeader({ user, profileData, isOwner }: ProfileHeaderProps) {
    const username = profileData?.user_info?.username;
    const photoURL = profileData?.user_info?.photoURL || user.photoURL;

    return (
        <div className="relative mb-8">
            {/* BANNER */}
            <div className="h-64 rounded-[3rem] overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 animate-gradient-xy"></div>
                <div className="absolute inset-0 bg-grain opacity-20"></div>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>
            </div>

            {/* PROCARD */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
                <div className="glass-card p-6 md:p-8 rounded-[2.5rem] !bg-card/80 dark:!bg-card/60 backdrop-blur-3xl shadow-2xl border-white/20 dark:border-white/5">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-end">

                        {/* AVATAR */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="relative -mt-20 md:-mt-24 shrink-0"
                        >
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] p-1.5 bg-card shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 ease-out">
                                <img
                                    src={getAbsUrl(photoURL)}
                                    alt={user.displayName || "User"}
                                    className="w-full h-full object-cover rounded-[2rem] bg-muted"
                                />
                            </div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-card rounded-full" title="Online"></div>
                        </motion.div>

                        {/* INFO */}
                        <div className="flex-1 w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground mb-2">
                                        {user.displayName}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
                                        <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full">@{username}</span>
                                        <span className="flex items-center gap-1.5"><MapPin size={14} /> Earth</span>
                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {new Date().getFullYear()}</span>
                                    </div>
                                </div>

                                {/* ACTIONS */}
                                <div className="flex gap-3 w-full md:w-auto">
                                    {isOwner && (
                                        <Link
                                            href="/profile/edit"
                                            className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2"
                                        >
                                            <Edit size={16} />
                                            <span>Edit Profile</span>
                                        </Link>
                                    )}
                                    <button className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2">
                                        <Share2 size={16} />
                                        <span>Share</span>
                                    </button>
                                </div>
                            </div>

                            {/* BIO (Optional) */}
                            <p className="mt-6 text-muted-foreground leading-relaxed max-w-2xl">
                                Building resilient systems and sharing the journey. Turning failures into features.
                                {/* TODO: Add bio to backend profile schema */}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
