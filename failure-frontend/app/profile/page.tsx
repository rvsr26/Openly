"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api, { getAbsUrl } from "../lib/api";

import Navbar from "../components/Navbar";
import PostItem from "../components/PostItem";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Award, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Post } from "../types";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    user_info: {
      username?: string;
      photoURL?: string;
    };
    stats: {
      total_posts: number;
      total_views: number;
    };
    posts: Post[];
  } | null>(null);
  const [error, setError] = useState("");

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    /* ---------------- FETCH PROFILE ---------------- */
    const fetchProfile = async (uid: string) => {
      try {
        const res = await api.get(
          `/users/${uid}/profile`
        );

        if (!res.data?.user_info) {
          setError("Profile not initialized.");
          return;
        }

        if (!res.data.user_info.username) {
          router.push("/setup-username");
          return;
        }

        setProfileData(res.data);
      } catch (e) {
        console.error(e);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      fetchProfile(currentUser.uid);
    });

    return () => unsubscribe();
  }, [router]); // fetching depends on router? No, but functions inside useEffect should be stable or refs. 
  // Ideally fetchProfile should be useCallback or moved inside. 
  // I will move fetchProfile inside useEffect for simplicity or define it before and suppress dependency if I don't want to useCallback.
  // Actually, I can just eslint-disable line if I know what I'm doing. 
  // Better: Move fetchProfile logic inside useEffect.


  /* ---------------- STATES ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="glass-card p-8 text-center rounded-2xl border border-border">
            <h2 className="text-2xl font-bold text-foreground">
              Access Denied
            </h2>
            <p className="text-muted-foreground mt-2">
              Please login to view your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center text-destructive">{error}</div>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const username = profileData?.user_info?.username;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mt-28 max-w-6xl mx-auto px-4 pb-12">
        {/* BACK */}
        <Link
          href="/"
          className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary mb-6 transition-all"
        >
          <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span> BACK TO FEED
        </Link>

        {/* HEADER CARD */}
        <div className="glass-card shadow-xl overflow-hidden mb-10 border border-white/20 !rounded-[3rem]">
          <div className="h-48 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-800 relative">
            <div className="absolute inset-0 bg-grain opacity-20"></div>
          </div>

          <div className="px-10 pb-10">
            <div className="relative -mt-20 mb-6 flex justify-between items-end">
              <div className="relative group/avatar">
                <div className="absolute -inset-1.5 bg-background rounded-[2.5rem] shadow-2xl"></div>
                <img
                  src={getAbsUrl(profileData?.user_info?.photoURL || user.photoURL)}
                  className="relative w-40 h-40 rounded-[2rem] border-4 border-white dark:border-zinc-900 shadow-2xl bg-secondary object-cover group-hover:rotate-2 transition-transform duration-500"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 mb-4">
                <Link
                  href="/profile/edit"
                  className="px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-primary/20 bg-white/50 dark:bg-zinc-900/50 hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                >
                  EDIT PROFILE
                </Link>

                {username && (
                  <Link
                    href={`/u/${username}`}
                    className="px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl bg-primary text-primary-foreground premium-shadow hover:brightness-110 transition-all active:scale-95"
                  >
                    VIEW PUBLIC
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-10">
              <div>
                <h1 className="text-5xl font-black text-foreground tracking-tighter mb-2">
                  {user.displayName}
                </h1>
                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                  @{username}
                </span>
              </div>
              <p className="text-muted-foreground font-medium text-lg md:ml-4 md:mb-1.5 opacity-70 italic">— Contributor</p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-10">

              <Stat
                label="Reviews Shared"
                value={profileData.stats.total_posts}
                icon={<TrendingUp className="text-indigo-500" size={20} />}
              />
              <Stat
                label="People Impacted"
                value={profileData.stats.total_views}
                icon={<Users className="text-emerald-500" size={20} />}
              />
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* ABOUT */}
          <div className="w-full lg:w-1/3">
            <div className="glass-card p-8 sticky top-32 group">
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-foreground flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                About Me
              </h3>
              <p className="text-muted-foreground font-medium leading-relaxed mb-6">
                This is your personal resilient space. Review your past insights and refine your perspective.
                and track how many people your vulnerability has empowered.
              </p>
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Impact Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-xs font-black text-primary">65%</span>
                </div>
              </div>
            </div>
          </div>

          {/* POSTS */}
          <div className="w-full lg:w-2/3">
            <h3 className="text-xs font-black uppercase tracking-widest mb-8 text-foreground flex items-center gap-2">
              <div className="w-1.5 h-6 bg-violet-500 rounded-full"></div>
              MY ACTIVITY
            </h3>

            {profileData.posts.length === 0 && (
              <div className="text-center py-20 glass-card !rounded-[3rem] border border-dashed border-primary/20 text-muted-foreground">
                <div className="mb-4 opacity-20"><TrendingUp size={48} className="mx-auto" /></div>
                <p className="font-bold uppercase tracking-widest text-xs">You haven’t posted any reviews yet.</p>
              </div>
            )}

            {profileData.posts.map((post: Post) => (
              <div key={post.id} className="mb-8">
                {post.is_rejected && (
                  <div className="bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-t-[2rem] border-x border-t border-destructive/20 relative z-10">
                    ⚠ SHIELDED: POST HIDDEN FROM PUBLIC FEED
                  </div>
                )}
                <div className={`${post.is_rejected ? "opacity-75" : ""} transition-opacity`}>
                  <PostItem post={post} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- STAT COMPONENT ---------------- */
interface StatProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
}

function Stat({ label, value, icon }: StatProps) {
  return (
    <div className="glass-card p-6 border-white/10 hover:border-primary/20 bg-primary/[0.02] flex items-center gap-6 group">
      <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div>
        <span className="block text-3xl font-black text-foreground tracking-tighter">
          {value || 0}
        </span>
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
          {label}
        </span>
      </div>
    </div>
  );
}
