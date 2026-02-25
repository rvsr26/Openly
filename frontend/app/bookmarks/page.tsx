"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "../lib/api";

import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import PostItem from "../components/PostItem";
import { useRouter } from "next/navigation";
import { Post } from "../types";

import { useAuth } from "@/context/AuthContext";

export default function BookmarksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- AUTH check ---------------- */
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  /* ---------------- FETCH BOOKMARKS ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      try {
        const res = await api.get(
          `/users/${user.uid}/bookmarks`
        );
        setPosts(res.data);
      } catch (err) {
        console.error("Failed to load bookmarks", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading bookmarks...
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground">

      <main className="pt-24 max-w-3xl mx-auto px-4 pb-10">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Saved Posts</h1>

        {posts.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center border-dashed border-2 border-border/50 bg-secondary/20 text-muted-foreground">
            You haven’t saved any posts yet.
          </div>
        )}

        <div className="space-y-6">
          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}
