"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import PostItem from "../components/PostItem";
import { useSearchParams } from "next/navigation";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
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
      const res = await axios.get("http://127.0.0.1:8000/search", {
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
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />

      <main className="pt-24 max-w-4xl mx-auto px-4 pb-10">
        <h1 className="text-2xl font-bold mb-6">🔍 Search</h1>

        {/* SEARCH INPUT */}
        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && performSearch(query)}
            placeholder="Search failures, topics, keywords..."
            className="w-full p-4 border rounded-lg"
          />
        </div>

        {/* STATES */}
        {loading && (
          <div className="text-center text-gray-500">Searching...</div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="bg-white border rounded-lg p-6 text-center text-gray-500">
            No results found for "{query}"
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
