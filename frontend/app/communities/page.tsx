"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Search, Plus, Globe, Lock, TrendingUp, Sparkles, ChevronRight, Loader2
} from "lucide-react";
import api from "@/app/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Navbar from "@/app/components/Navbar";

const CATEGORIES = ["All", "Career", "Startup", "Academic", "Tech", "Health", "Life", "Relationship", "General"];

interface Community {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    privacy: string;
    member_count: number;
    post_count: number;
    banner_url?: string;
    icon_url?: string;
    created_at: string;
}

function CommunityCard({ community, myRole, onJoin, onLeave }: { community: Community; myRole?: string; onJoin: (slug: string) => void; onLeave: (slug: string) => void }) {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const handleAction = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) { router.push("/login"); return; }
        setLoading(true);
        try {
            if (myRole === "member") {
                await onLeave(community.slug);
            } else {
                await onJoin(community.slug);
            }
        } finally {
            setLoading(false);
        }
    };

    const isMember = !!myRole;
    const isPending = myRole === "pending";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-card border border-border rounded-[2rem] overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 h-full flex flex-col"
        >
            {/* Banner */}
            <div className="h-28 relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background group-hover:scale-105 transition-transform duration-700">
                {community.banner_url && (
                    <img src={community.banner_url} alt="banner" className="w-full h-full object-cover opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>

            <Link href={`/communities/${community.slug}`} className="flex-1 flex flex-col p-6 -mt-8 relative">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-3xl mb-4 shadow-xl group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                    {community.icon_url ? (
                        <img src={community.icon_url} className="w-full h-full object-cover" alt="icon" />
                    ) : (
                        <span className="font-black text-primary">{community.name.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                        <h3 className="font-black text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">{community.name}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-0.5 bg-muted/50 rounded-lg">
                                {community.category}
                            </span>
                            {community.privacy === "private" ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                                    <Lock size={9} /> Private
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                                    <Globe size={9} /> Public
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-6 flex-1">
                    {community.description || "No description yet. Explore more details about this community."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-bold">
                        <span className="flex items-center gap-1"><Users size={12} className="text-primary" /> {community.member_count.toLocaleString()}</span>
                        <span>{community.post_count} posts</span>
                    </div>

                    <button
                        onClick={handleAction}
                        disabled={loading || isPending}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${isMember
                            ? isPending
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                            : "bg-primary text-white shadow-xl shadow-primary/20 hover:brightness-110"
                            } ${loading ? "opacity-60" : ""}`}
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                        {isMember ? (isPending ? "Pending" : "Leave") : "Join"}
                    </button>
                </div>
            </Link>
        </motion.div>
    );
}

export default function CommunitiesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [membershipMap, setMembershipMap] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [sort, setSort] = useState("members");
    const [loading, setLoading] = useState(true);

    const fetchCommunities = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ sort, limit: "30" });
            if (search) params.set("search", search);
            if (category !== "All") params.set("category", category);
            const res = await api.get(`/api/v1/communities/?${params}`);
            setCommunities(res.data.communities || []);
        } catch (e) {
            toast.error("Failed to load communities");
        } finally {
            setLoading(false);
        }
    }, [search, category, sort]);

    useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

    const fetchMyCommunities = useCallback(async () => {
        if (!user) {
            setMyCommunities([]);
            setMembershipMap({});
            return;
        }
        try {
            const res = await api.get(`/api/v1/users/${user.uid}/communities`);
            const comms: Community[] = res.data.communities || [];
            setMyCommunities(comms);
            const map: Record<string, string> = {};
            comms.forEach(c => { map[c.id] = "member"; });
            setMembershipMap(map);
        } catch (e) { }
    }, [user]);

    useEffect(() => { fetchMyCommunities(); }, [fetchMyCommunities]);

    const handleJoin = async (slug: string) => {
        try {
            const res = await api.post(`/api/v1/communities/${slug}/join`);
            const status = res.data.status;
            toast.success(status === "active" ? "Joined successfully!" : "Join request sent!");
            fetchCommunities();
            fetchMyCommunities();
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to join");
        }
    };

    const handleLeave = async (slug: string) => {
        if (!confirm("Leave this community?")) return;
        try {
            await api.post(`/api/v1/communities/${slug}/leave`);
            toast.success("Left community");
            fetchCommunities();
            fetchMyCommunities();
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to leave");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">

                {/* HERO HEADER */}
                <div className="text-center py-12 mb-8">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 border border-primary/20">
                            <Sparkles size={12} /> Communities
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                            Find Your <span className="text-primary">Tribe</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Join communities of like-minded people. Share, learn, and grow together.
                        </p>
                    </motion.div>
                </div>

                {/* SEARCH + CREATE */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search communities..."
                            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                    </div>
                    <Link
                        href="/communities/create"
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex-shrink-0"
                    >
                        <Plus size={16} /> Create Community
                    </Link>
                </div>

                {/* FILTERS */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-none">
                    {/* Sort */}
                    <div className="flex items-center gap-2 flex-shrink-0 bg-card border border-border rounded-2xl p-1">
                        {[{ key: "members", icon: Users, label: "Popular" }, { key: "new", icon: Sparkles, label: "New" }, { key: "posts", icon: TrendingUp, label: "Active" }].map(s => (
                            <button
                                key={s.key}
                                onClick={() => setSort(s.key)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${sort === s.key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <s.icon size={12} /> {s.label}
                            </button>
                        ))}
                    </div>
                    {/* Category pills */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-2xl text-xs font-bold flex-shrink-0 transition-all border ${category === cat ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MY COMMUNITIES */}
                {myCommunities.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                            <Users size={18} className="text-primary" /> Your Communities
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {myCommunities.slice(0, 4).map((c, i) => (
                                <CommunityCard key={c.id} community={c} myRole={membershipMap[c.id]} onJoin={handleJoin} onLeave={handleLeave} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ALL COMMUNITIES GRID */}
                <div>
                    <h2 className="text-lg font-black text-foreground mb-4">
                        {search ? `Results for "${search}"` : "Discover Communities"}
                    </h2>
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-primary" />
                        </div>
                    ) : communities.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-5xl mb-4">🏘️</div>
                            <h3 className="text-xl font-black text-foreground mb-2">No communities found</h3>
                            <p className="text-muted-foreground mb-6">Be the first to create one!</p>
                            <Link href="/communities/create" className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:brightness-110 transition-all">
                                Create Community
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {communities.map((c, i) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <CommunityCard community={c} myRole={membershipMap[c.id]} onJoin={handleJoin} onLeave={handleLeave} />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
