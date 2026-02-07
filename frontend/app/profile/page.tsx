"use client";

import { useEffect, useState } from "react";
import api from "../lib/api";

import Navbar from "../components/Navbar";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Post } from "../types";

import ProfileHeader from "./ProfileHeader";
import ProfileStats from "./ProfileStats";
import ProfileTabs from "./ProfileTabs";
import ProfileContent from "./ProfileContent";

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
  const [activeTab, setActiveTab] = useState("Overview");

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
  }, [router]);


  /* ---------------- STATES ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground animate-pulse">
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

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      <main className="mt-28 max-w-6xl mx-auto px-4">

        <ProfileHeader
          user={user}
          profileData={profileData}
          isOwner={true}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT SIDEBAR (Stats & About for Desktop) */}
          <div className="lg:col-span-1 space-y-8">
            <div className="glass-card p-6 hidden lg:block sticky top-28">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">About Me</h3>
              <p className="text-sm font-medium leading-relaxed text-foreground/80">
                Turning failures into features. Every stumble is a step forward.
              </p>
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase text-primary">Resilience</span>
                  <span className="text-xs font-bold text-primary">98%</span>
                </div>
                <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[98%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3">
            <ProfileStats stats={profileData.stats} />

            <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            <ProfileContent
              activeTab={activeTab}
              posts={profileData.posts}
              user={user}
            />
          </div>
        </div>

      </main>
    </div>
  );
}
