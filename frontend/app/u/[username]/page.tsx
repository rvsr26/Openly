"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api, { getAbsUrl } from "../../lib/api";

import Navbar from "../../components/Navbar";
import PostItem from "../../components/PostItem";
import { useParams } from "next/navigation";
import { auth } from "../../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { UserPlus, Check, Clock, MessageSquare, Briefcase } from "lucide-react";
import Link from "next/link";
import { Post } from "../../types";

export default function PublicProfilePage() {
  const { username } = useParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [profile, setProfile] = useState<{
    user_info: {
      id: string;
      username: string;
      display_name: string;
      photo?: string;
      headline?: string;
    };
    stats: {
      total_posts: number;
      total_views: number;
    };
    posts: Post[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "accepted" | "self">("none");
  const [isSender, setIsSender] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Try fetching by username
        try {
          const res = await api.get(`/users/username/${username}`);
          setProfile(res.data);
          checkConnection(res.data.user_info.id);
        } catch (usernameError) {
          // 2. Fallback: Try fetching by User ID
          console.log("Username fetch failed, trying by ID...");
          const res = await api.get(`/users/${username}/profile`);
          setProfile(res.data);
          checkConnection(res.data.user_info.id);
        }
      } catch (err) {
        console.error("Failed to load public profile", err);
        setError("User not found");
      } finally {
        setLoading(false);
      }
    };

    const checkConnection = async (profileId: string) => {
      if (currentUser && currentUser.uid !== profileId) {
        try {
          const statusRes = await api.get(`/network/${currentUser.uid}/status/${profileId}`);
          setConnectionStatus(statusRes.data.status);
          setIsSender(statusRes.data.is_sender);
        } catch (e) {
          console.error("Failed to fetch connection status", e);
        }
      } else if (currentUser && currentUser.uid === profileId) {
        setConnectionStatus("self");
      }
    };

    if (username) fetchData();
  }, [username, currentUser]);



  const handleConnect = async () => {
    if (!currentUser || !profile) return;
    try {
      await api.post(`/connect/${profile.user_info.id}`, {
        requester_id: currentUser.uid
      });
      setConnectionStatus("pending");
      setIsSender(true);
    } catch (e) {
      alert("Failed to send request");
    }
  };

  const handleAccept = async () => {
    if (!currentUser || !profile) return;
    try {
      await api.post(`/connect/${currentUser.uid}/accept`, {
        requester_id: profile.user_info.id
      });
      setConnectionStatus("accepted");
    } catch (e) {
      alert("Failed to accept");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (error) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Navbar />
      <h2 className="text-2xl font-bold text-destructive mb-2">{error}</h2>
      <Link href="/" className="text-primary hover:underline">Go Home</Link>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 max-w-4xl mx-auto px-4 pb-12">
        {/* HEADER */}
        <div className="glass-card rounded-xl overflow-hidden mb-6 border border-border">
          <div className="h-32 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-zinc-900 dark:to-black"></div>

          <div className="px-8 pb-8 relative">
            <div className="flex justify-between items-end -mt-12 mb-4">
              <img
                src={getAbsUrl(profile.user_info.photo)}
                className="w-32 h-32 rounded-full border-4 border-background shadow-md bg-secondary object-cover"
              />

              {/* ACTION BUTTONS */}
              <div className="mb-2">
                {connectionStatus === "self" && (
                  <Link href="/profile" className="px-4 py-2 rounded-full border border-border bg-background hover:bg-secondary font-semibold transition">
                    Edit Profile
                  </Link>
                )}

                {connectionStatus === "none" && currentUser && (
                  <button
                    onClick={handleConnect}
                    className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold hover:opacity-90 transition flex items-center gap-2"
                  >
                    <UserPlus size={18} /> Connect
                  </button>
                )}

                {connectionStatus === "pending" && isSender && (
                  <button disabled className="px-6 py-2 rounded-full bg-secondary text-muted-foreground font-semibold border border-border flex items-center gap-2 cursor-not-allowed">
                    <Clock size={18} /> Pending
                  </button>
                )}

                {connectionStatus === "pending" && !isSender && (
                  <button
                    onClick={handleAccept}
                    className="px-6 py-2 rounded-full bg-green-600 text-white font-bold hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Check size={18} /> Accept Invitation
                  </button>
                )}

                {connectionStatus === "accepted" && (
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-full border border-primary text-primary font-semibold hover:bg-primary/10 transition flex items-center gap-2">
                      <MessageSquare size={18} /> Message
                    </button>
                    <span className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-semibold flex items-center gap-2">
                      <Check size={18} /> Connected
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-3xl font-bold text-foreground">
                {profile.user_info.display_name}
              </h1>
              <p className="text-muted-foreground">@{profile.user_info.username}</p>

              {/* Phase 3 Placeholder */}
              <p className="mt-2 text-foreground/80 flex items-center gap-2">
                <Briefcase size={16} className="text-muted-foreground" />
                {profile.user_info.headline || "Member"}
              </p>
            </div>

            {/* STATS */}
            <div className="flex gap-8 border-t border-border mt-6 pt-6">
              <div>
                <span className="block text-2xl font-bold">{profile.stats.total_posts}</span>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Posts</span>
              </div>
              <div>
                <span className="block text-2xl font-bold">{profile.stats.total_views}</span>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Views</span>
              </div>

            </div>
          </div>
        </div>

        {/* POSTS */}
        <h2 className="text-xl font-bold mb-4">Reviews Shared</h2>

        {profile.posts.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
            No public posts shared yet.
          </div>
        )}

        <div className="space-y-4">
          {profile.posts.map((post: Post) => (
            <div key={post.id} className={post.is_rejected ? "opacity-75 grayscale" : ""}>
              <PostItem post={post} />
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
