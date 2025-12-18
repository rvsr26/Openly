"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Navbar from "../components/Navbar";
import PostItem from "../components/PostItem";
import { useRouter } from "next/navigation";

export default function BookmarksPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  /* ---------------- FETCH BOOKMARKS ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/users/${user.uid}/bookmarks`
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
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />

      <main className="pt-24 max-w-3xl mx-auto px-4 pb-10">
        <h1 className="text-2xl font-bold mb-6">🔖 Saved Posts</h1>

        {posts.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-300 p-6 text-center text-gray-500">
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
