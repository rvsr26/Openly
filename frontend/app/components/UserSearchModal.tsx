"use client";

import { useState, useEffect } from "react";
import { X, Search, User as UserIcon } from "lucide-react";
import api, { getAbsUrl } from "../lib/api";

interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (userId: string) => void;
    currentUserId: string;
}

export default function UserSearchModal({ isOpen, onClose, onSelectUser, currentUserId }: UserSearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length < 3) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await api.get(`/search/?q=${query}&user_id=${currentUserId}`);
                // Filter out current user and only keep users (not posts)
                const users = res.data.filter((item: any) => item.type === "user" && item.id !== currentUserId);
                setResults(users);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, currentUserId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[80vh]">
                {/* HEADER */}
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                    <h2 className="font-bold text-lg">New Message</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* SEARCH INPUT */}
                <div className="p-4 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            autoFocus
                        />
                    </div>
                </div>

                {/* RESULTS */}
                <div className="overflow-y-auto flex-1 p-2">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">Searching...</div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => onSelectUser(user.id)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors text-left group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0 border border-border">
                                        {user.user_pic ? (
                                            <img src={getAbsUrl(user.user_pic)} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                                <UserIcon size={16} className="text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-foreground">{user.display_name}</div>
                                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 3 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">No users found.</div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm opacity-60">
                            Type at least 3 characters to search.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
