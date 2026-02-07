"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from "@tanstack/react-query";
import api from './lib/api';

import PostItem from './components/PostItem';
import CreatePost from './components/CreatePost';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import TopInsightsBanner from './components/TopInsightsBanner';

import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Post } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Clock, Flame, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ["All", "Career", "Startup", "Academic", "Relationship", "Health"];

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"new" | "hot" | "top" | "for-you">("hot");

  const [user, setUser] = useState<User | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchFeed = useCallback(async (category: string, sort: string) => {
    try {
      setLoading(true);
      let url = `/feed/?sort_by=${sort}`;
      if (category !== "All") url += `&category=${category}`;
      if (auth.currentUser) url += `&user_id=${auth.currentUser.uid}`;
      const res = await api.get(url);
      setPosts(res.data);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get("category");
    if (catParam) setActiveFilter(catParam);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["userProfile", user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const res = await api.get(`/users/${user.uid}/profile`);
      return res.data;
    },
    enabled: !!user,
  });

  const username = profile?.user_info?.username || "";
  const userPhoto = profile?.user_info?.photoURL || user?.photoURL || "";

  useEffect(() => {
    fetchFeed(activeFilter, sortBy);
  }, [activeFilter, sortBy, fetchFeed]);

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const res = await api.post('/posts/', {
        content: content,
        user_id: user.uid,
        user_name: user.displayName || "Anonymous User", // Fallback for missing display name
        user_pic: userPhoto || user.photoURL,
        is_anonymous: isAnonymous,
        image_url: imageUrl
      });

      if (res.data.status === "rejected_for_toxicity") {
        alert("⚠️ Post Submitted but Flagged.\\n\\nYour post was detected as toxic by AI and will be hidden from the public feed.");
      }

      setContent('');
      setImageUrl('');
      fetchFeed(activeFilter, sortBy);

    } catch (error: any) {
      console.error("Post submission error:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        alert(`Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // The request was made but no response was received
        alert("Network Error: Could not connect to backend. Please ensure the server is running.");
      } else {
        // Something happened in setting up the request that triggered an Error
        alert(`System Error: ${error.message}`);
      }
    }
    setLoading(false);
  };

  const handleSaveDraft = async () => {
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      await api.post('/drafts/', {
        user_id: user.uid,
        content: content,
        is_anonymous: isAnonymous,
        category: "All",
        image_url: ""
      });
      alert("Draft saved!");
      setContent('');
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft.");
    } finally {
      setLoading(false);
    }
  };

  const [visiblePosts, setVisiblePosts] = useState(10);
  const handleLoadMore = () => setVisiblePosts(prev => prev + 10);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isPrefetching && posts.length > visiblePosts) {
          setIsPrefetching(true);
          setTimeout(() => {
            setVisiblePosts(prev => prev + 5);
            setIsPrefetching(false);
          }, 300);
        }
      },
      { threshold: 0.8 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [posts.length, visiblePosts, isPrefetching]);

  return (
    <div className="min-h-screen relative">

      {/* Hero Section with Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <main className="relative z-10 mt-24 sm:mt-28 mb-12 max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8">

        {/* RESPONSIVE GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">

          {/* LEFT SIDEBAR (Sticky on desktop) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto scrollbar-hide">
            <LeftSidebar user={user} username={username} userPhoto={userPhoto} />
          </aside>

          {/* CENTER FEED */}
          <div className="col-span-1 lg:col-span-6 space-y-4 sm:space-y-6 min-h-screen">

            {/* Top Insights Banner */}
            <TopInsightsBanner />

            {/* CREATE POST - CENTERED */}
            <CreatePost
              user={user}
              userPhoto={userPhoto}
              content={content}
              setContent={setContent}
              isAnonymous={isAnonymous}
              setIsAnonymous={setIsAnonymous}
              handleSubmit={handleSubmit}
              handleSaveDraft={handleSaveDraft}
              loading={loading}
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
            />

            {/* FILTER & SORT SECTION */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 sm:p-6 sticky top-20 sm:top-24 z-40 backdrop-blur-3xl"
            >
              <div className="flex flex-col gap-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-gradient-to-br from-primary to-primary/60 rounded-2xl shadow-lg shadow-primary/25">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight">
                        Community Feed
                      </h2>
                      <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Discover impactful stories
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sort Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-muted/30 rounded-2xl border border-border/50">
                  {[
                    { id: "new", label: "Newest", icon: Clock },
                    { id: "hot", label: "Trending", icon: Flame },
                    { id: "top", label: "Top", icon: Trophy }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id as "new" | "hot" | "top")}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${sortBy === s.id
                        ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                    >
                      <s.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* POSTS LIST */}
            <AnimatePresence mode="popLayout">
              <div className="space-y-4 sm:space-y-6 pb-20">
                {posts.slice(0, visiblePosts).map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                  >
                    <PostItem post={post} />
                  </motion.div>
                ))}

                {/* Load More Button */}
                {posts.length > visiblePosts && (
                  <div ref={loadMoreRef}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLoadMore}
                      className="w-full py-4 sm:py-5 glass-card hover:glass-premium text-primary font-bold text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 group"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isPrefetching ? "Loading..." : "Load more insights"}
                        {!isPrefetching && <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                      </span>
                    </motion.button>
                  </div>
                )}

                {/* Loading Skeleton */}
                {loading && posts.length === 0 && (
                  <div className="space-y-4 sm:space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glass-card p-4 sm:p-6 animate-pulse">
                        <div className="flex gap-3 mb-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-muted/50"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 sm:w-32 bg-muted/50 rounded"></div>
                            <div className="h-3 w-16 sm:w-20 bg-muted/50 rounded"></div>
                          </div>
                        </div>
                        <div className="h-6 w-3/4 bg-muted/50 rounded mb-4"></div>
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-muted/50 rounded"></div>
                          <div className="h-3 w-5/6 bg-muted/50 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!loading && posts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-12 sm:p-16 text-center border-dashed border-2"
                  >
                    <div className="mb-6 inline-flex p-4 sm:p-5 bg-primary/10 rounded-3xl">
                      <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary/60" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-foreground mb-2">No Reviews Yet</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xs mx-auto mb-6">
                      Try changing your filters or be the first to share your thoughts.
                    </p>
                    <button
                      onClick={() => setActiveFilter("All")}
                      className="btn-primary text-xs"
                    >
                      Clear all filters
                    </button>
                  </motion.div>
                )}
              </div>
            </AnimatePresence>
          </div>

          {/* RIGHT SIDEBAR (Sticky on desktop) */}
          <aside className="hidden xl:block xl:col-span-3 sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto scrollbar-hide">
            <RightSidebar
              user={user}
              userPhoto={userPhoto}
            />
          </aside>

        </div>
      </main>
    </div>
  );
}