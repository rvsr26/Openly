"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Globe, Lock, Settings, Loader2, TrendingUp, Sparkles, Flame,
    Shield, ArrowLeft, ChevronRight
} from "lucide-react";
import api from "@/app/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Navbar from "@/app/components/Navbar";
import PostItem from "@/app/components/PostItem";
import type { Post } from "@/app/types";

type SortKey = "new" | "hot" | "top";
type MemberRole = "owner" | "mod" | "member" | "pending" | null;

interface Community {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    privacy: string;
    member_count: number;
    post_count: number;
    owner_id: string;
    rules?: string;
    banner_url?: string;
    icon_url?: string;
    created_at: string;
}

const SORT_TABS: { key: SortKey; icon: React.ElementType; label: string }[] = [
    { key: "new", icon: Sparkles, label: "New" },
    { key: "hot", icon: Flame, label: "Hot" },
    { key: "top", icon: TrendingUp, label: "Top" },
];

export default function CommunityDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const router = useRouter();

    const [community, setCommunity] = useState<Community | null>(null);
    const [myRole, setMyRole] = useState<MemberRole>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [sort, setSort] = useState<SortKey>("new");
    const [loading, setLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);
    const [joining, setJoining] = useState(false);
    const [memberCount, setMemberCount] = useState(0);

    // Fetch community info
    useEffect(() => {
        api.get(`/api/v1/communities/${slug}`)
            .then(res => {
                setCommunity(res.data);
                setMemberCount(res.data.member_count);
                setLoading(false);
            })
            .catch(() => {
                toast.error("Community not found");
                router.push("/communities");
            });
    }, [slug, router]);

    // Check membership
    useEffect(() => {
        if (!user || !community) return;
        api.get(`/api/v1/users/${user.uid}/communities`)
            .then(res => {
                const comms: Community[] = res.data.communities || [];
                const found = comms.find(c => c.id === community.id);
                if (found) {
                    // determine role from ownership
                    api.get(`/api/v1/communities/${slug}/members`)
                        .then(mRes => {
                            const me = mRes.data.members?.find((m: any) => m.user_id === user.uid);
                            setMyRole(me?.role || "member");
                        });
                }
            })
            .catch(() => { });
        // also check pending
        api.get(`/api/v1/communities/${slug}/members?status=pending`)
            .then(res => {
                const pending = res.data.members?.find((m: any) => m.user_id === user.uid);
                if (pending) setMyRole("pending");
            })
            .catch(() => { });
    }, [user, community, slug]);

    // Fetch posts
    const fetchPosts = useCallback(async () => {
        if (!community) return;
        setPostsLoading(true);
        try {
            const res = await api.get(`/api/v1/communities/${slug}/posts?sort=${sort}`);
            setPosts(res.data.posts || []);
        } catch {
            toast.error("Failed to load posts");
        } finally {
            setPostsLoading(false);
        }
    }, [community, slug, sort]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleJoin = async () => {
        if (!user) { router.push("/login"); return; }
        setJoining(true);
        try {
            const res = await api.post(`/api/v1/communities/${slug}/join`);
            const status = res.data.status;
            if (status === "active") {
                setMyRole("member");
                setMemberCount(c => c + 1);
                toast.success("You joined the community!");
            } else {
                setMyRole("pending");
                toast.success("Join request sent!");
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to join");
        } finally {
            setJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm("Leave this community?")) return;
        try {
            await api.post(`/api/v1/communities/${slug}/leave`);
            setMyRole(null);
            setMemberCount(c => c - 1);
            toast.success("Left community");
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to leave");
        }
    };

    const isLocked = community?.privacy === "private" && !myRole;

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!community) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-16">

                {/* HERO BANNER */}
                <div className="relative h-52 md:h-64 overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-background">
                    {community.banner_url && (
                        <img src={community.banner_url} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                </div>

                {/* COMMUNITY HEADER */}
                <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-10">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-6">
                        {/* Icon */}
                        <div className="w-20 h-20 rounded-3xl bg-card border-4 border-background flex items-center justify-center text-3xl font-black text-primary shadow-2xl overflow-hidden flex-shrink-0">
                            {community.icon_url
                                ? <img src={community.icon_url} className="w-full h-full object-cover" alt="icon" />
                                : <span>{community.name.charAt(0)}</span>
                            }
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-2xl md:text-3xl font-black text-foreground">{community.name}</h1>
                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground rounded-full">
                                    {community.category}
                                </span>
                                {community.privacy === "private"
                                    ? <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-500"><Lock size={9} /> Private</span>
                                    : <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-500"><Globe size={9} /> Public</span>
                                }
                            </div>
                            <p className="text-muted-foreground text-sm">{community.description}</p>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {(myRole === "owner" || myRole === "mod") && (
                                <Link
                                    href={`/communities/${slug}/settings`}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                                >
                                    <Settings size={14} /> Settings
                                </Link>
                            )}
                            {myRole === null && (
                                <button
                                    onClick={handleJoin}
                                    disabled={joining}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-2xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                                >
                                    {joining ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                                    Join Community
                                </button>
                            )}
                            {myRole === "pending" && (
                                <span className="px-6 py-2.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-2xl text-sm font-bold">
                                    Request Pending
                                </span>
                            )}
                            {(myRole === "member") && (
                                <button
                                    onClick={handleLeave}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-sm font-bold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
                                >
                                    Joined
                                </button>
                            )}
                        </div>
                    </div>

                    {/* STATS ROW */}
                    <div className="flex gap-6 mb-8 text-sm text-muted-foreground font-semibold">
                        <span><strong className="text-foreground font-black">{memberCount.toLocaleString()}</strong> members</span>
                        <span><strong className="text-foreground font-black">{community.post_count}</strong> posts</span>
                        {myRole && myRole !== "pending" && <span className="text-primary font-black flex items-center gap-1"><Shield size={12} /> {myRole}</span>}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

                        {/* LEFT: FEED */}
                        <div>
                            {isLocked ? (
                                <div className="glass-card p-12 text-center">
                                    <Lock size={40} className="text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-black text-foreground mb-2">Private Community</h3>
                                    <p className="text-muted-foreground mb-6">Request to join to see posts in this community.</p>
                                    <button
                                        onClick={handleJoin}
                                        disabled={joining}
                                        className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                                    >
                                        {joining ? "Requesting..." : "Request to Join"}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* SORT TABS */}
                                    <div className="flex gap-2 mb-6 bg-card border border-border rounded-2xl p-1 w-fit">
                                        {SORT_TABS.map(({ key, icon: Icon, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => setSort(key)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${sort === key ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                                            >
                                                <Icon size={13} /> {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* POST TO COMMUNITY CTA */}
                                    {myRole && myRole !== "pending" && (
                                        <Link
                                            href={`/create-post?community=${community.id}&community_name=${encodeURIComponent(community.name)}`}
                                            className="flex items-center gap-3 glass-card p-4 mb-6 hover:border-primary/30 transition-all group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <Users size={16} className="text-primary" />
                                            </div>
                                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Share something with {community.name}...</span>
                                            <ChevronRight size={16} className="text-muted-foreground ml-auto" />
                                        </Link>
                                    )}

                                    {postsLoading ? (
                                        <div className="flex justify-center py-20">
                                            <Loader2 size={28} className="animate-spin text-primary" />
                                        </div>
                                    ) : posts.length === 0 ? (
                                        <div className="glass-card p-12 text-center">
                                            <div className="text-5xl mb-4">📭</div>
                                            <h3 className="text-xl font-black text-foreground mb-2">No posts yet</h3>
                                            <p className="text-muted-foreground">Be the first to post in {community.name}!</p>
                                        </div>
                                    ) : (
                                        <AnimatePresence mode="wait">
                                            <motion.div key={sort} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                {posts.map(post => <PostItem key={post.id} post={post} />)}
                                            </motion.div>
                                        </AnimatePresence>
                                    )}
                                </>
                            )}
                        </div>

                        {/* RIGHT: SIDEBAR INFO */}
                        <div className="space-y-4">
                            {/* About */}
                            <div className="glass-card p-5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">About</h3>
                                <p className="text-sm text-foreground/80 leading-relaxed mb-4">{community.description || "No description."}</p>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Created {new Date(community.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                                </div>
                            </div>

                            {/* Rules */}
                            {community.rules && (
                                <div className="glass-card p-5">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Community Rules</h3>
                                    <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">{community.rules}</pre>
                                </div>
                            )}

                            {/* Moderation link for mods */}
                            {(myRole === "owner" || myRole === "mod") && (
                                <Link
                                    href={`/communities/${slug}/settings`}
                                    className="block glass-card p-5 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Shield size={16} className="text-primary" />
                                        <div>
                                            <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">Moderation</p>
                                            <p className="text-xs text-muted-foreground">Manage members &amp; settings</p>
                                        </div>
                                        <ChevronRight size={14} className="text-muted-foreground ml-auto" />
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
