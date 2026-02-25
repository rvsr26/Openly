"use client";
import { useEffect, useState } from "react";
import api, { getAbsUrl } from "@/app/lib/api";
import { X, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface UserListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    userId: string;
    type: "followers" | "following";
}

export default function UserListModal({ isOpen, onClose, title, userId, type }: UserListModalProps) {
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/users/${userId}/${type}${user ? `?requester_id=${user.uid}` : ''}`);
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [isOpen, userId, type, user]);

    const handleFollowToggle = async (targetId: string, isCurrentlyFollowing: boolean, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return;

        try {
            if (isCurrentlyFollowing) {
                await api.delete(`/users/${targetId}/follow?user_id=${user.uid}`);
                setUsers(users.map(u => u.user_id === targetId ? { ...u, is_following: false } : u));
            } else {
                await api.post(`/users/${targetId}/follow`, { user_id: user.uid });
                setUsers(users.map(u => u.user_id === targetId ? { ...u, is_following: true } : u));
            }
        } catch (err) {
            console.error("Follow toggle failed", err);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Users size={18} className="text-primary" />
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-2 flex-col flex gap-1">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>
                        ) : users.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No users found.</div>
                        ) : (
                            users.map((u) => (
                                <Link
                                    key={u.user_id}
                                    href={`/u/${u.username || u.user_id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden relative border border-border shrink-0">
                                        <Image
                                            src={getAbsUrl(u.user_pic) || "/assets/default_avatar.png"}
                                            fill
                                            className="object-cover"
                                            alt={u.display_name || "User"}
                                            sizes="40px"
                                        />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{u.display_name || "User"}</p>
                                        <p className="text-xs text-muted-foreground truncate">@{u.username || u.user_id}</p>
                                    </div>
                                    {user && u.user_id !== user.uid && (
                                        <button
                                            onClick={(e) => handleFollowToggle(u.user_id, u.is_following, e)}
                                            className={`ml-auto px-4 py-1.5 rounded-full text-xs font-bold transition-all ${u.is_following
                                                ? "bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border"
                                                : "bg-primary text-primary-foreground hover:opacity-90"
                                                }`}
                                        >
                                            {u.is_following ? "Following" : "Follow"}
                                        </button>
                                    )}
                                </Link>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
