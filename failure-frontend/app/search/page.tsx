"use client";

import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import api from "../lib/api";

import Navbar from "../components/Navbar";
import PostItem from "../components/PostItem";
import { useSearchParams } from "next/navigation";
import { Post } from "../types";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- SEARCH ---------------- */
  const performSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.get("/search", {
        params: { q },
      });
      setResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
      setError("Failed to search. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- INITIAL SEARCH ---------------- */
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 max-w-4xl mx-auto px-4 pb-10">
        <h1 className="text-2xl font-bold mb-6 text-foreground">🔍 Search</h1>

        {/* SEARCH INPUT */}
        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && performSearch(query)}
            placeholder="Search reviews, topics, keywords..."
            className="w-full p-4 bg-secondary/50 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-xl outline-none transition-all placeholder:text-muted-foreground text-foreground shadow-sm"
          />
        </div>

        {/* STATES */}
        {loading && (
          <div className="text-center text-muted-foreground animate-pulse">Searching...</div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm font-medium border border-destructive/20">
            {error}
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground border border-dashed border-border">
            No results found for &quot;{query}&quot;
          </div>
        )}

        {/* RESULTS */}
        <div className="space-y-6">
          {results.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="pt-24 text-center text-muted-foreground">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
