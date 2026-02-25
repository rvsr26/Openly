"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import api from "@/app/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Globe, Lock, ChevronRight, ImageIcon, Hash, Loader2, Users } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["General", "Career", "Startup", "Academic", "Tech", "Health", "Life", "Relationship"];

export default function CreateCommunityPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General");
    const [privacy, setPrivacy] = useState<"public" | "private">("public");
    const [rules, setRules] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [iconUrl, setIconUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const slugPreview = name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 60);

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await api.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setBannerUrl(res.data.url);
            toast.success("Banner uploaded!");
        } catch {
            toast.error("Failed to upload banner");
        } finally {
            setUploading(false);
        }
    };

    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await api.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setIconUrl(res.data.url);
            toast.success("Icon uploaded!");
        } catch {
            toast.error("Failed to upload icon");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { router.push("/login"); return; }
        if (!name.trim()) { toast.error("Community name is required"); return; }
        setSubmitting(true);
        try {
            const res = await api.post("/api/v1/communities/", {
                name: name.trim(),
                description,
                category,
                privacy,
                rules,
                banner_url: bannerUrl || null,
                icon_url: iconUrl || null,
            });
            toast.success("Community created! 🎉");
            router.push(`/communities/${res.data.slug}`);
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || "Failed to create community");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-24 pb-20 max-w-2xl mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                    <div className="mb-8">
                        <Link href="/communities" className="text-xs text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest flex items-center gap-1 mb-4">
                            ← Back to Communities
                        </Link>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Users size={20} className="text-primary" />
                            </div>
                            <h1 className="text-3xl font-black text-foreground">Create Community</h1>
                        </div>
                        <p className="text-muted-foreground">Build a place for your community to gather and share.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* BANNER PREVIEW */}
                        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-background border border-border h-36 flex items-end">
                            {bannerUrl && <img src={bannerUrl} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-70" />}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="relative p-4 flex items-end gap-4 w-full">
                                {/* ICON */}
                                <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-xl overflow-hidden relative">
                                    {iconUrl
                                        ? <img src={iconUrl} className="w-full h-full object-cover" alt="icon" />
                                        : <span className="text-2xl font-black text-primary">{name.charAt(0) || "?"}</span>
                                    }
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                        <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                                        <ImageIcon size={14} className="text-white" />
                                    </label>
                                </div>
                                <label className="ml-auto flex items-center gap-2 px-4 py-2 bg-black/40 text-white text-xs font-bold rounded-xl backdrop-blur-sm cursor-pointer hover:bg-black/60 transition-all border border-white/20">
                                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                                    {bannerUrl ? "Change Banner" : "Add Banner"}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                                </label>
                            </div>
                        </div>

                        {/* NAME */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Community Name *</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Tech Founders"
                                maxLength={60}
                                required
                                className="w-full px-4 py-3 bg-card border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                            {name && (
                                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                    <Hash size={10} /> URL: <span className="text-primary font-bold">openly.com/communities/{slugPreview}</span>
                                </p>
                            )}
                        </div>

                        {/* DESCRIPTION */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="What's this community about?"
                                rows={3}
                                className="w-full px-4 py-3 bg-card border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                            />
                        </div>

                        {/* CATEGORY */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${category === cat ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-card text-muted-foreground border-border hover:border-primary/30"}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* PRIVACY */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Privacy</label>
                            <div className="grid grid-cols-2 gap-3">
                                {([
                                    { val: "public", icon: Globe, title: "Public", desc: "Anyone can view and join" },
                                    { val: "private", icon: Lock, title: "Private", desc: "Members must be approved" },
                                ] as const).map(({ val, icon: Icon, title, desc }) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setPrivacy(val)}
                                        className={`flex gap-3 p-4 rounded-2xl border text-left transition-all ${privacy === val ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-card hover:border-primary/30"}`}
                                    >
                                        <Icon size={20} className={privacy === val ? "text-primary mt-0.5" : "text-muted-foreground mt-0.5"} />
                                        <div>
                                            <p className={`text-sm font-black ${privacy === val ? "text-primary" : "text-foreground"}`}>{title}</p>
                                            <p className="text-xs text-muted-foreground">{desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RULES */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Community Rules</label>
                            <textarea
                                value={rules}
                                onChange={e => setRules(e.target.value)}
                                placeholder="1. Be respectful&#10;2. No spam&#10;3. Stay on topic"
                                rows={4}
                                className="w-full px-4 py-3 bg-card border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none font-mono"
                            />
                        </div>

                        {/* SUBMIT */}
                        <button
                            type="submit"
                            disabled={submitting || !name.trim()}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl text-sm font-black hover:brightness-110 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                            {submitting ? "Creating..." : "Create Community"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
