"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import axios from "axios";
import api, { getAbsUrl } from "../lib/api";

import { Bell, Heart, MessageSquare, UserPlus, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  actor_name: string;
  actor_pic: string;
  resource_id: string;
  message?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsubscribe();
  }, []);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];
      const res = await api.get(`/notifications?user_id=${currentUser.uid}`);
      return res.data;
    },
    enabled: !!currentUser,
    refetchInterval: 30000 // Poll every 30s
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  if (!currentUser) return <div className="p-10 text-center">Please login to view notifications</div>;

  return (
    <div className="min-h-screen bg-background">
      <main className="mt-28 pb-10 px-4 md:px-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Notifications</h1>

        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground glass-card rounded-xl">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) readMutation.mutate(notif.id);
                  if (notif.type === "connection_request" || notif.type === "connection_accepted") {
                    router.push(`/u/${notif.actor_name}`);
                  } else {
                    router.push(`/post/${notif.resource_id}`);
                  }
                }}
                className={`p-4 rounded-xl border flex gap-4 cursor-pointer transition ${notif.is_read
                  ? "bg-background border-border/50 opacity-80 hover:bg-secondary/50"
                  : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  }`}
              >
                <div className="mt-1">
                  {notif.type === "like" && <Heart size={20} className="text-red-500 fill-red-500" />}
                  {notif.type === "comment" && <MessageSquare size={20} className="text-blue-500 fill-blue-500" />}
                  {notif.type === "connection_request" && <UserPlus size={20} className="text-green-500" />}
                  {notif.type === "connection_accepted" && <Check size={20} className="text-green-500" />}
                </div>

                <img
                  src={getAbsUrl(notif.actor_pic)}
                  className="w-12 h-12 rounded-full object-cover border"
                  alt="p"
                />

                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-bold">{notif.actor_name}</span>
                    {" "}
                    {notif.type === "like" && "liked your post."}
                    {notif.type === "comment" && "commented on your post."}
                    {notif.type === "connection_request" && "sent you a connection request."}
                    {notif.type === "connection_accepted" && "accepted your connection request."}
                  </p>
                  {notif.message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">&quot;{notif.message}&quot;</p>
                  )}
                  <p className="text-xs text-primary/60 mt-2">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>

                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
