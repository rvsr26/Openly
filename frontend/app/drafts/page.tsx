"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { PenTool, Trash2, ArrowRight } from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import api from "../lib/api";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Draft {
    id: string;
    content: string;
    updated_at: string;
}

export default function DraftsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) fetchDrafts(u.uid);
            else setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const fetchDrafts = async (uid: string) => {
        try {
            const res = await api.get(`/drafts/?user_id=${uid}`);
            setDrafts(res.data);
        } catch (error) {
            console.error("Failed to fetch drafts", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user || !confirm("Delete this draft?")) return;
        try {
            await api.delete(`/drafts/${id}?user_id=${user.uid}`);
            setDrafts(drafts.filter(d => d.id !== id));
        } catch (e) {
            alert("Failed to delete draft");
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

    if (!user) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
                <Navbar />
                <p>Please log in to view drafts.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="pt-32 max-w-2xl mx-auto px-4">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                        <PenTool size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Your Drafts</h1>
                        <p className="text-muted-foreground text-sm">Manage your unfinished thoughts.</p>
                    </div>
                </div>

                {drafts.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                        <p className="text-muted-foreground">No drafts found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {drafts.map((draft) => (
                            <div key={draft.id} className="glass-card p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all group relative">
                                <div className="pr-10">
                                    <p className="text-white/80 font-medium mb-3 line-clamp-2">{draft.content}</p>
                                    <p className="text-xs text-white/30 font-bold uppercase tracking-wider">
                                        Last edited {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleDelete(draft.id)}
                                    className="absolute top-4 right-4 p-2 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
