"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "../lib/api";

import { auth } from "../firebase";

const MAX_CHARS = 500;

export default function CreatePostPage() {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    if (content.length < 10) {
      setError("Post should be at least 10 characters");
      return;
    }

    if (content.length > MAX_CHARS) {
      setError(`Post cannot exceed ${MAX_CHARS} characters`);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    const userName =
      user.displayName && user.displayName.trim().length > 0
        ? user.displayName
        : "Anonymous";

    setLoading(true);

    try {
      await api.post("/posts/", {
        user_id: user.uid,
        user_name: userName,        // ✅ REQUIRED
        user_pic: user.photoURL || null,
        content: content.trim(),
        is_anonymous: anonymous,
      });

      router.push("/");
    } catch (err: unknown) {
      console.error("CREATE POST ERROR:", err);

      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create post. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <form className="glass-card w-full max-w-lg p-8 md:p-10 rounded-2xl animate-in fade-in zoom-in-95 duration-300" onSubmit={handleSubmit}>
        <h1 className="text-3xl font-bold text-center mb-2 text-foreground">Post a Review 💭</h1>
        <p className="text-center text-muted-foreground mb-8">Share your suggestions and help the community grow</p>

        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-xl mb-6 text-sm text-center font-medium">{error}</div>}

        {/* CONTENT */}
        <textarea
          placeholder="What's on your mind? Share a suggestion or review..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full px-4 py-4 mb-2 rounded-xl border border-input bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground resize-none"
        />

        {/* CHARACTER COUNT */}
        <div className="text-right text-xs text-muted-foreground mb-6 font-medium">
          {content.length}/{MAX_CHARS}
        </div>

        {/* ANONYMOUS */}
        <label className="flex items-center gap-3 mb-8 cursor-pointer group">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
          />
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Post anonymously</span>
        </label>

        {/* ACTIONS */}
        <div className="flex gap-4">
          <button
            type="button"
            className="flex-1 py-3.5 rounded-xl bg-secondary text-foreground font-bold hover:bg-secondary/80 transition"
            onClick={() => router.back()}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-70 transition shadow-sm active:scale-95"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </main>
  );
}
