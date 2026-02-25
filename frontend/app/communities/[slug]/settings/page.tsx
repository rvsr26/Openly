"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft, Loader2, Trash2, Shield, Crown, UserX, ChevronDown, Globe, Lock,
    Check, X, AlertTriangle, Settings
} from "lucide-react";
import api from "@/app/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Navbar from "@/app/components/Navbar";
import { getAbsUrl } from "@/app/lib/api";

interface Member {
    id: string;
    user_id: string;
    role: "owner" | "mod" | "member";
    status: "active" | "pending";
    joined_at: string;
    display_name?: string;
    photoURL?: string;
}

interface Community {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    privacy: string;
    rules?: string;
    banner_url?: string;
    icon_url?: string;
    member_count: number;
}

const ROLE_BADGE = {
    owner: { label: "Owner", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    mod: { label: "Mod", color: "text-primary bg-primary/10 border-primary/20" },
    member: { label: "Member", color: "text-muted-foreground bg-muted/50 border-border" },
};

export default function CommunitySettingsPage() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const router = useRouter();

    const [community, setCommunity] = useState<Community | null>(null);
    const [myRole, setMyRole] = useState<string | null>(null);
    const [activeMembers, setActiveMembers] = useState<Member[]>([]);
    const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"settings" | "members" | "requests">("members");

    // Edit state
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editRules, setEditRules] = useState("");
    const [editPrivacy, setEditPrivacy] = useState<"public" | "private">("public");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        Promise.all([
            api.get(`/api/v1/communities/${slug}`),
            api.get(`/api/v1/communities/${slug}/members?limit=100`),
            api.get(`/api/v1/communities/${slug}/members?status=pending&limit=100`),
        ]).then(([cRes, mRes, pRes]) => {
            const comm: Community = cRes.data;
            setCommunity(comm);
            setEditName(comm.name);
            setEditDesc(comm.description || "");
            setEditRules(comm.rules || "");
            setEditPrivacy(comm.privacy as "public" | "private");

            const members: Member[] = mRes.data.members || [];
            setActiveMembers(members);

            const me = members.find(m => m.user_id === user.uid);
            setMyRole(me?.role || null);

            if (!me || !["owner", "mod"].includes(me.role)) {
                toast.error("You don't have permission to access settings");
                router.push(`/communities/${slug}`);
                return;
            }

            setPendingMembers(pRes.data.members || []);
            setLoading(false);
        }).catch(() => {
            toast.error("Failed to load settings");
            router.push(`/communities/${slug}`);
        });
    }, [slug, user, router]);

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await api.patch(`/api/v1/communities/${slug}`, {
                name: editName,
                description: editDesc,
                rules: editRules,
            });
            toast.success("Settings saved!");
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async (uid: string) => {
        try {
            await api.post(`/api/v1/communities/${slug}/approve/${uid}`);
            toast.success("Member approved!");
            setPendingMembers(prev => prev.filter(m => m.user_id !== uid));
            setCommunity(c => c ? { ...c, member_count: c.member_count + 1 } : c);
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to approve");
        }
    };

    const handleKick = async (uid: string, name?: string) => {
        if (!confirm(`Kick ${name || "this member"}?`)) return;
        try {
            await api.delete(`/api/v1/communities/${slug}/kick/${uid}`);
            toast.success("Member removed");
            setActiveMembers(prev => prev.filter(m => m.user_id !== uid));
            setCommunity(c => c ? { ...c, member_count: c.member_count - 1 } : c);
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to kick");
        }
    };

    const handlePromote = async (uid: string) => {
        try {
            await api.post(`/api/v1/communities/${slug}/promote/${uid}`);
            toast.success("Promoted to mod!");
            setActiveMembers(prev => prev.map(m => m.user_id === uid ? { ...m, role: "mod" } : m));
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to promote");
        }
    };

    const handleDemote = async (uid: string) => {
        try {
            await api.post(`/api/v1/communities/${slug}/demote/${uid}`);
            toast.success("Demoted to member");
            setActiveMembers(prev => prev.map(m => m.user_id === uid ? { ...m, role: "member" } : m));
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to demote");
        }
    };

    const handleDelete = async () => {
        if (!confirm("PERMANENTLY delete this community and all its data? This CANNOT be undone.")) return;
        if (!confirm("Are you absolutely sure?")) return;
        try {
            await api.delete(`/api/v1/communities/${slug}`);
            toast.success("Community deleted");
            router.push("/communities");
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to delete");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!community) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-24 pb-20 max-w-3xl mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Link href={`/communities/${slug}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary font-bold uppercase tracking-widest mb-6 transition-colors">
                        <ArrowLeft size={12} /> Back to Community
                    </Link>

                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Settings size={18} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground">{community.name}</h1>
                            <p className="text-xs text-muted-foreground">Community Settings</p>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="flex gap-2 mb-8 bg-card border border-border rounded-2xl p-1 w-fit">
                        {([
                            { key: "members", label: `Members (${activeMembers.length})` },
                            { key: "requests", label: `Requests (${pendingMembers.length})` },
                            ...(myRole === "owner" ? [{ key: "settings", label: "Edit" }] : []),
                        ] as { key: typeof tab; label: string }[]).map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === t.key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* MEMBERS TAB */}
                    {tab === "members" && (
                        <div className="space-y-3">
                            {activeMembers.map(member => (
                                <div key={member.id} className="glass-card p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                                        {member.photoURL
                                            ? <img src={getAbsUrl(member.photoURL)} className="w-full h-full object-cover" alt="" onError={(e) => { e.currentTarget.src = "/assets/default_avatar.png"; }} />
                                            : <span className="text-sm font-black text-muted-foreground">{member.user_id.charAt(0).toUpperCase()}</span>
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-foreground truncate">{member.display_name || member.user_id}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Joined {new Date(member.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${ROLE_BADGE[member.role]?.color}`}>
                                            {member.role === "owner" ? <Crown size={8} className="inline mr-1" /> : member.role === "mod" ? <Shield size={8} className="inline mr-1" /> : null}
                                            {ROLE_BADGE[member.role]?.label}
                                        </span>
                                        {member.user_id !== user?.uid && member.role !== "owner" && (
                                            <div className="flex gap-1">
                                                {myRole === "owner" && member.role === "member" && (
                                                    <button onClick={() => handlePromote(member.user_id)} className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors" title="Promote to Mod">
                                                        <Shield size={13} />
                                                    </button>
                                                )}
                                                {myRole === "owner" && member.role === "mod" && (
                                                    <button onClick={() => handleDemote(member.user_id)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors" title="Demote">
                                                        <ChevronDown size={13} />
                                                    </button>
                                                )}
                                                <button onClick={() => handleKick(member.user_id, member.display_name)} className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors" title="Kick">
                                                    <UserX size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {activeMembers.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">No members found</div>
                            )}
                        </div>
                    )}

                    {/* REQUESTS TAB */}
                    {tab === "requests" && (
                        <div className="space-y-3">
                            {pendingMembers.length === 0 ? (
                                <div className="glass-card p-10 text-center">
                                    <Check size={32} className="text-emerald-500 mx-auto mb-3" />
                                    <p className="text-muted-foreground">No pending join requests</p>
                                </div>
                            ) : (
                                pendingMembers.map(member => (
                                    <div key={member.id} className="glass-card p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                                            <span className="text-sm font-black text-muted-foreground">{member.user_id.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-foreground">{member.user_id}</p>
                                            <p className="text-xs text-muted-foreground">Requested {new Date(member.joined_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(member.user_id)}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:brightness-110 transition-all"
                                            >
                                                <Check size={12} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleKick(member.user_id)}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-bold hover:bg-destructive/20 transition-all"
                                            >
                                                <X size={12} /> Decline
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* SETTINGS TAB (owner only) */}
                    {tab === "settings" && myRole === "owner" && (
                        <div className="space-y-6">
                            <div className="glass-card p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Community Name</label>
                                    <input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Description</label>
                                    <textarea
                                        value={editDesc}
                                        onChange={e => setEditDesc(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:border-primary/50 transition-all resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Rules</label>
                                    <textarea
                                        value={editRules}
                                        onChange={e => setEditRules(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:border-primary/50 transition-all resize-none font-mono"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={saving}
                                    className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>

                            {/* DANGER ZONE */}
                            <div className="glass-card p-6 border border-destructive/20">
                                <h3 className="flex items-center gap-2 text-sm font-black text-destructive mb-3">
                                    <AlertTriangle size={14} /> Danger Zone
                                </h3>
                                <p className="text-xs text-muted-foreground mb-4">Deleting this community is irreversible. All posts and membership data will be lost.</p>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-6 py-3 bg-destructive text-white rounded-2xl text-sm font-bold hover:brightness-110 transition-all"
                                >
                                    <Trash2 size={14} /> Delete Community
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
