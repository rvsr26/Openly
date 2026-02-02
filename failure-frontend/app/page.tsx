"use client";
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api, { getAbsUrl } from './lib/api';

import Navbar from './components/Navbar';
import PostItem from './components/PostItem';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Post } from './types';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import CreatePost from './components/CreatePost';

const CATEGORIES = ["All", "Career", "Startup", "Academic", "Relationship", "Health"];

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("hot");

  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");

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

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const res = await api.get(`/users/${currentUser.uid}/profile`);
          if (res.data.user_info?.username) {
            setUsername(res.data.user_info.username);
          }
        } catch (e) {
          console.error("Error fetching profile:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
        user_name: user.displayName,
        user_pic: user.photoURL,
        is_anonymous: isAnonymous
      });

      if (res.data.status === "rejected_for_toxicity") {
        alert("⚠️ Post Submitted but Flagged.\n\nYour post was detected as toxic by AI and will be hidden from the public feed.");
      }

      setContent('');
      fetchFeed(activeFilter, sortBy);

    } catch (error) {
      console.error(error);
      alert("System Error: Could not connect to backend.");
    }
    setLoading(false);
  };

  // Infinite scroll simulation / Load More
  const [visiblePosts, setVisiblePosts] = useState(10);
  const handleLoadMore = () => setVisiblePosts(prev => prev + 10);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mt-28 mb-12 max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6">

        {/* ADVANCED GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start relative">

          {/* LEFT SIDEBAR (Sticky) - Shifted Left (col-span-3) */}
          <div className="hidden md:block md:col-span-3 lg:col-span-3 sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
            <LeftSidebar user={user} username={username} />

            {/* Footer Links */}
            <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 opacity-40">
              <div className="flex flex-wrap gap-4">
                <a href="#" className="hover:text-primary transition-colors">About</a>
                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms</a>
              </div>
              <p className="mt-4 font-black">© 2026</p>
            </div>
          </div>

          {/* CENTER FEED - Narrower (col-span-6) */}
          <div className="col-span-1 md:col-span-9 lg:col-span-6 space-y-8 min-h-screen">

            {!user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-10 text-center !rounded-[3rem] border-primary/10 overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex p-3 bg-white dark:bg-zinc-950 rounded-3xl premium-shadow ring-1 ring-primary/10 group-hover:rotate-6 transition-transform duration-500">
                    <img src="/assets/logo.png" alt="Openly" className="h-14 w-auto object-contain" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground mb-3 tracking-tighter">Welcome to <span className="text-gradient">Open Space</span></h3>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                    A dedicated platform for constructive reviews, professional suggestions, and community insights. Join the discussion.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link href="/login" className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest premium-shadow hover:brightness-110 transition-all active:scale-95">LOGIN</Link>
                    <Link href="/signup" className="px-8 py-3 rounded-2xl bg-white/50 dark:bg-zinc-900/50 text-foreground font-black text-xs uppercase tracking-widest border border-white/20 hover:bg-white transition-all active:scale-95">SIGN UP</Link>
                  </div>
                </div>
              </motion.div>
            )}



            {/* FILTER & SORT TABS */}
            <div className="sticky top-28 z-30 bg-background/50 backdrop-blur-3xl py-4 -mx-4 px-4 md:static md:bg-transparent md:p-0">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1 w-full sm:w-auto">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveFilter(cat)}
                      className={`px-6 py-2.5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all whitespace-nowrap border relative group ${activeFilter === cat
                        ? "text-primary-foreground border-transparent"
                        : "bg-white/40 dark:bg-zinc-900/40 border-white/20 text-muted-foreground hover:border-primary/30 hover:text-primary"
                        }`}>
                      {activeFilter === cat && (
                        <motion.div
                          layoutId="activeFilter"
                          className="absolute inset-0 bg-primary premium-shadow"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          style={{ borderRadius: '1rem' }}
                        />
                      )}
                      <span className="relative z-10">{cat}</span>
                    </button>
                  ))}
                </div>

                <div className="flex bg-white/40 dark:bg-zinc-900/40 p-1.5 rounded-2xl border border-white/20 premium-shadow h-fit w-full sm:w-auto justify-center sm:justify-start">
                  {(user ? ["for-you", "top", "hot", "new"] : ["top", "hot", "new"]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSortBy(mode)}
                      className={`px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all relative flex-1 sm:flex-none ${sortBy === mode
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-primary"
                        }`}
                    >
                      {sortBy === mode && (
                        <motion.div
                          layoutId="sortBy"
                          className="absolute inset-0 bg-primary premium-shadow rounded-xl"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{mode.replace("-", " ")}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* POSTS LIST */}
            <div className="space-y-4 pb-20">
              {posts.slice(0, visiblePosts).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                >
                  <PostItem post={post} />
                </motion.div>
              ))}

              {posts.length > visiblePosts && (
                <button
                  onClick={handleLoadMore}
                  className="w-full py-4 bg-primary/5 hover:bg-primary/10 text-primary rounded-3xl font-black text-xs uppercase tracking-widest transition-all duration-300 border border-primary/10"
                >
                  Load more insights
                </button>
              )}

              {posts.length === 0 && (
                <div className="glass-card !rounded-[3rem] p-20 text-center border-dashed border-2 border-primary/20 bg-primary/[0.01]">
                  <div className="mb-4 inline-flex p-4 bg-primary/5 rounded-3xl text-primary/30">
                    <MessageCircle size={40} />
                  </div>
                  <p className="text-xl text-foreground font-black tracking-tight mb-2">NO REVIEWS YET</p>
                  <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto mb-8">Try changing your filters or be the first to share your thoughts with the community.</p>
                  <button onClick={() => setActiveFilter("All")} className="text-primary font-black text-xs uppercase tracking-widest hover:underline">Clear all filters</button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR (Sticky) - col-span-3 */}
          <div className="hidden lg:block lg:col-span-3 sticky top-28 h-[calc(100vh-8rem)]">
            <RightSidebar
              user={user}
              content={content}
              setContent={setContent}
              isAnonymous={isAnonymous}
              setIsAnonymous={setIsAnonymous}
              handleSubmit={handleSubmit}
              loading={loading}
            />
          </div>

        </div>
      </main>
    </div>
  );
}