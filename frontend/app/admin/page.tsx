"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "../lib/api";

import Navbar from "../components/Navbar";
import PostItem from "../components/PostItem";
import { Post } from "../types";

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlaggedPosts();
  }, []);

  const fetchFlaggedPosts = async () => {
    try {
      const res = await api.get(
        "/feed?flagged=true"
      );
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to load flagged posts", err);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post permanently?")) return;

    try {
      await api.delete(
        `/posts/${postId}?user_id=admin`
      );
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      alert("Failed to delete post");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Admin Panel...
      </div>
    );

  return (
    <>
      <Navbar />

      <main className="pt-24 max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">🛡️ Admin Dashboard</h1>

        {posts.length === 0 && (
          <div className="bg-white p-6 rounded shadow text-gray-500">
            No flagged posts 🎉
          </div>
        )}

        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="relative">
              {/* Flag Banner */}
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-t-lg text-sm font-bold">
                ⚠ Flagged / Rejected Post
              </div>

              <PostItem post={post} />

              {/* Admin Actions */}
              <div className="flex gap-4 bg-white border border-t-0 rounded-b-lg p-4">
                <button
                  onClick={() => deletePost(post.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
