"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import axios from "axios";
import api, { getAbsUrl } from "../lib/api";

import { ConnectionRequest, Connection } from "../types";
import { Check, X, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";

export default function MyNetworkPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => setCurrentUser(u));
        return () => unsubscribe();
    }, []);

    // 1. Fetch Pending Requests
    const { data: requests = [] } = useQuery<ConnectionRequest[]>({
        queryKey: ["networkRequests", currentUser?.uid],
        queryFn: async () => {
            if (!currentUser) return [];
            const res = await api.get(`/network/${currentUser.uid}/requests`);
            return res.data;
        },
        enabled: !!currentUser,
    });

    // 2. Fetch My Connections
    const { data: connections = [] } = useQuery<Connection[]>({
        queryKey: ["myConnections", currentUser?.uid],
        queryFn: async () => {
            if (!currentUser) return [];
            const res = await api.get(`/network/${currentUser.uid}/connections`);
            return res.data;
        },
        enabled: !!currentUser,
    });

    // Accept Mutation
    const acceptMutation = useMutation({
        mutationFn: async (requesterId: string) => {
            await api.post(`/connect/${currentUser?.uid}/accept`, {
                requester_id: requesterId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["networkRequests"] });
            queryClient.invalidateQueries({ queryKey: ["myConnections"] });
        }
    });

    if (!currentUser) return <div className="p-10 text-center">Please login to manage connections</div>;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mt-28 pb-10 px-4 md:px-8 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-foreground">My Network</h1>

                {/* --- INVITATIONS --- */}
                {requests.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                            <UserPlus size={20} />
                            Invitations ({requests.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {requests.map((req) => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card p-4 rounded-xl flex items-center gap-4 border border-border/50"
                                >
                                    <img
                                        src={getAbsUrl(req.user_pic)}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                                        alt={req.username}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-foreground truncate">{req.display_name || req.username}</h3>
                                        <p className="text-sm text-muted-foreground">wants to connect</p>

                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => acceptMutation.mutate(req.requester_id)}
                                                className="flex-1 bg-primary text-primary-foreground text-sm font-semibold py-1.5 rounded-full hover:bg-primary/90 flex items-center justify-center gap-1 transition"
                                            >
                                                <Check size={16} /> Accept
                                            </button>
                                            <button className="flex-1 bg-secondary text-secondary-foreground text-sm font-semibold py-1.5 rounded-full hover:bg-secondary/80 flex items-center justify-center gap-1 transition">
                                                <X size={16} /> Ignore
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- CONNECTIONS --- */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                        <Users size={20} />
                        Your Connections ({connections.length})
                    </h2>

                    {connections.length === 0 ? (
                        <div className="text-center py-10 glass-card rounded-xl">
                            <p className="text-muted-foreground">You haven&apos;t connected with anyone yet.</p>
                            <Link href="/search" className="text-primary hover:underline mt-2 inline-block">Find people to connect</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {connections.map((conn) => (
                                <Link href={`/profile?uid=${conn.user_id}`} key={conn.user_id}>
                                    <div className="glass-card p-4 rounded-xl flex flex-col items-center text-center cursor-pointer hover:border-primary/50 transition h-full">
                                        <img
                                            src={getAbsUrl(conn.user_pic)}
                                            className="w-20 h-20 rounded-full object-cover mb-3 ring-2 ring-border"
                                            alt={conn.username}
                                        />
                                        <h3 className="font-bold text-foreground truncate w-full">{conn.display_name || conn.username}</h3>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{conn.headline || "Member"}</p>

                                        <button className="mt-4 w-full py-1.5 border border-primary text-primary text-sm font-semibold rounded-full hover:bg-primary/10 transition">
                                            Message
                                        </button>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
