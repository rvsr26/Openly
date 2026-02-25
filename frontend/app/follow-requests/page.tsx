"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api, { getAbsUrl } from "@/app/lib/api";
import { UserCheck, UserX, UserPlus, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface FollowRequest {
    id: string;
    requester_id: string;
    requester_name: string;
    requester_username: string;
    requester_pic?: string;
    created_at: string;
}

export default function FollowRequestsPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchRequests = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/users/${user.uid}/follow-requests`);
            setRequests(res.data);
        } catch (e) {
            console.error("Failed to fetch follow requests", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, [user]);

    const accept = async (req: FollowRequest) => {
        setActionLoading(req.id);
        try {
            await api.post(`/users/follow-requests/${req.id}/accept?user_id=${user!.uid}`);
            setRequests(prev => prev.filter(r => r.id !== req.id));
        } catch (e) {
            console.error("Accept failed", e);
        } finally {
            setActionLoading(null);
        }
    };

    const reject = async (req: FollowRequest) => {
        setActionLoading(req.id + "_reject");
        try {
            await api.post(`/users/follow-requests/${req.id}/reject?user_id=${user!.uid}`);
            setRequests(prev => prev.filter(r => r.id !== req.id));
        } catch (e) {
            console.error("Reject failed", e);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-20 max-w-2xl mx-auto px-4">

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                    <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Follow Requests</h1>
                    <p className="text-sm text-muted-foreground">People who want to follow you</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-black text-foreground mb-1">No pending requests</h3>
                    <p className="text-sm text-muted-foreground">When someone sends you a follow request, it'll appear here.</p>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="space-y-3">
                        {requests.map(req => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -40, scale: 0.95 }}
                                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/3 border border-white/8 hover:border-white/15 transition-all"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-primary/20 shrink-0">
                                        {req.requester_pic ? (
                                            <img
                                                src={getAbsUrl(req.requester_pic)}
                                                alt={req.requester_name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.src = "/assets/default_avatar.png"; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-sm font-black">
                                                {req.requester_name?.[0] || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <Link href={`/u/${req.requester_username}`}
                                            className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate block">
                                            {req.requester_name}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">@{req.requester_username}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => accept(req)}
                                        disabled={!!actionLoading}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => reject(req)}
                                        disabled={!!actionLoading}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-muted-foreground text-xs font-bold rounded-xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 disabled:opacity-50 transition-all"
                                    >
                                        <UserX className="w-4 h-4" />
                                        Decline
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
}
