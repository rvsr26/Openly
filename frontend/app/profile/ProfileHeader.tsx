"use client";

import { User } from "firebase/auth";
import api, { getAbsUrl } from "../lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { Edit, Share2, MapPin, Calendar, Link as LinkIcon, Check, UserCheck, Clock } from "lucide-react";
import PhoenixBadge from "../components/PhoenixBadge";
import TextReveal from "../components/ui/TextReveal";
import AnimatedButton from "../components/ui/AnimatedButton";
import { useState, useEffect } from "react";
import UserListModal from "../components/UserListModal";

interface ProfileHeaderProps {
    user: User;
    profileData: any;
    isOwner: boolean;
    onRefresh?: () => void;
}

export default function ProfileHeader({ user, profileData, isOwner, onRefresh }: ProfileHeaderProps) {
    const username = profileData?.user_info?.username;
    const photoURL = isOwner ? (profileData?.user_info?.photoURL || user?.photoURL) : profileData?.user_info?.photoURL;
    const score = profileData?.user_info?.phoenix_score || 0;
    const badges = profileData?.user_info?.badges || [];
    const [copied, setCopied] = useState(false);

    // Local follow status — synced from profileData on change
    const [followStatus, setFollowStatus] = useState<'not_following' | 'pending' | 'accepted'>('not_following');

    // Local counts — synced from profileData, updated optimistically on follow/unfollow
    const [followersCount, setFollowersCount] = useState<number>(profileData?.stats?.followers || 0);
    const [followingCount, setFollowingCount] = useState<number>(profileData?.stats?.following || 0);

    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; type: "followers" | "following" }>({
        isOpen: false,
        title: "",
        type: "followers"
    });

    // Sync follow status and counts when profileData changes (e.g. on initial load or navigation)
    useEffect(() => {
        const status = profileData?.user_info?.follow_status;
        const isFollowing = profileData?.user_info?.is_following;
        if (status && status !== 'not_following') {
            setFollowStatus(status);
        } else if (isFollowing) {
            setFollowStatus('accepted');
        } else {
            setFollowStatus('not_following');
        }
        setFollowersCount(profileData?.stats?.followers || 0);
        setFollowingCount(profileData?.stats?.following || 0);
    }, [profileData]);

    const handleCopy = () => {
        const url = `${window.location.origin}/u/${username || user.uid}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFollowToggle = async () => {
        if (!user || isFollowLoading) return;
        setIsFollowLoading(true);
        const targetId = profileData?.user_info?.id;
        try {
            if (followStatus === 'accepted' || followStatus === 'pending') {
                // Unfollow or cancel request — optimistic update
                await api.delete(`/users/${targetId}/follow?user_id=${user.uid}`);
                setFollowStatus('not_following');
                // Decrement count only if was accepted (actually following)
                if (followStatus === 'accepted') {
                    setFollowersCount(c => Math.max(0, c - 1));
                }
            } else {
                // Send follow request
                const res = await api.post(`/users/${targetId}/follow`, { user_id: user.uid });
                const status = res.data?.status;
                if (status === 'already_following') {
                    setFollowStatus('accepted');
                    setFollowersCount(c => c + 1);
                } else if (status === 'accepted') {
                    setFollowStatus('accepted');
                    setFollowersCount(c => c + 1);
                } else {
                    // pending
                    setFollowStatus('pending');
                }
            }
            // Trigger parent refetch in background so counts come from server too
            onRefresh?.();
        } catch (e) {
            console.error("Follow toggle failed", e);
        } finally {
            setIsFollowLoading(false);
        }
    };

    return (
        <div className="relative mb-8">
            {/* BANNER */}
            <div className="h-64 rounded-[3rem] overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--gradient-1))] via-[hsl(var(--gradient-2))] to-[hsl(var(--gradient-3))] animate-gradient-xy"></div>
                <div className="absolute inset-0 bg-grain opacity-20"></div>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>
            </div>

            {/* PROCARD */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
                <div className="glass-card p-6 md:p-8 rounded-[2.5rem] !bg-card/85 dark:!bg-card/60 backdrop-blur-3xl shadow-2xl border-white/20 dark:border-white/5">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-end">

                        {/* AVATAR */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative -mt-20 md:-mt-24 shrink-0"
                        >
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] p-1.5 bg-card shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 ease-out group">
                                <img
                                    src={getAbsUrl(photoURL)}
                                    onError={(e) => {
                                        if (!e.currentTarget.src.includes("default_avatar.png")) {
                                            e.currentTarget.src = "/assets/default_avatar.png";
                                        }
                                    }}
                                    alt={user?.displayName || "User"}
                                    className="w-full h-full object-cover rounded-[2rem] bg-muted group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-card rounded-full shadow-lg" title="Online"></div>
                        </motion.div>

                        {/* INFO */}
                        <div className="flex-1 w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">
                                            <TextReveal text={profileData?.user_info?.display_name || user.displayName || "User Name"} />
                                        </h1>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.8, type: "spring" }}
                                        >
                                            <PhoenixBadge badges={badges} score={score} size="md" />
                                        </motion.div>
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground"
                                    >
                                        <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full">@{username}</span>
                                        <span className="flex items-center gap-1.5"><MapPin size={14} /> Earth</span>
                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {new Date().getFullYear()}</span>
                                    </motion.div>

                                    {/* Stats (Followers/Following) — live local state */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="flex items-center gap-6 mt-4 text-sm font-semibold text-foreground/90"
                                    >
                                        <button
                                            onClick={() => setModalConfig({ isOpen: true, title: "Followers", type: "followers" })}
                                            className="group flex gap-2 items-center cursor-pointer transition-transform active:scale-95"
                                        >
                                            <span className="font-black text-lg text-foreground group-hover:text-primary transition-colors">{followersCount}</span>
                                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Followers</span>
                                        </button>
                                        <button
                                            onClick={() => setModalConfig({ isOpen: true, title: "Following", type: "following" })}
                                            className="group flex gap-2 items-center cursor-pointer transition-transform active:scale-95"
                                        >
                                            <span className="font-black text-lg text-foreground group-hover:text-primary transition-colors">{followingCount}</span>
                                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Following</span>
                                        </button>
                                    </motion.div>
                                </div>

                                {/* ACTIONS */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex gap-3 w-full md:w-auto"
                                >
                                    {isOwner ? (
                                        <Link href="/profile/edit">
                                            <AnimatedButton variant="secondary" className="w-full md:w-auto flex items-center gap-2">
                                                <Edit size={16} />
                                                <span>Edit</span>
                                            </AnimatedButton>
                                        </Link>
                                    ) : (
                                        <AnimatedButton
                                            onClick={handleFollowToggle}
                                            variant={followStatus === 'accepted' ? "secondary" : followStatus === 'pending' ? "secondary" : "primary"}
                                            className="w-full md:w-auto flex items-center gap-2 min-w-[130px]"
                                            disabled={isFollowLoading}
                                        >
                                            {isFollowLoading ? (
                                                <span className="opacity-60">...</span>
                                            ) : followStatus === 'accepted' ? (
                                                <>
                                                    <UserCheck size={16} />
                                                    <span>Following</span>
                                                </>
                                            ) : followStatus === 'pending' ? (
                                                <>
                                                    <Clock size={16} />
                                                    <span>Requested</span>
                                                </>
                                            ) : (
                                                <span>Follow</span>
                                            )}
                                        </AnimatedButton>
                                    )}
                                    <AnimatedButton
                                        onClick={handleCopy}
                                        className="w-full md:w-auto flex items-center gap-2"
                                    >
                                        {copied ? <Check size={16} /> : <Share2 size={16} />}
                                        <span>{copied ? "Copied!" : "Share"}</span>
                                    </AnimatedButton>
                                </motion.div>
                            </div>

                            {/* BIO */}
                            {profileData?.user_info?.bio && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8, duration: 0.8 }}
                                    className="mt-6 text-muted-foreground leading-relaxed max-w-2xl"
                                >
                                    {profileData.user_info.bio}
                                </motion.p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <UserListModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                type={modalConfig.type}
                userId={profileData?.user_info?.id || user?.uid}
            />
        </div>
    );
}
