"use client";

import { useEffect, useState, useCallback } from "react";
import api from "../lib/api";

import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Post } from "../types";

import ProfileHeader from "./ProfileHeader";
import ProfileStats from "./ProfileStats";
import ProfileTabs from "./ProfileTabs";
import ProfileContent from "./ProfileContent";

import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
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

  /* ---------------- FETCH PROFILE ---------------- */
  const fetchProfile = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${uid}/profile`);

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
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchProfile(user.uid);
    } else {
      setLoading(false);
    }
  }, [user, fetchProfile]);


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
      <div className="min-h-screen">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center text-destructive">{error}</div>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="min-h-screen pb-20">

      <main className="mt-20 max-w-6xl mx-auto px-4">

        <ProfileHeader
          user={user}
          profileData={profileData}
          isOwner={true}
        />

        <div className="grid grid-cols-1 gap-8">
          {/* MAIN CONTENT */}
          <div className="w-full">
            <ProfileStats stats={profileData.stats} />

            <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            <ProfileContent
              activeTab={activeTab}
              posts={profileData.posts}
              user={profileData.user_info}
              isOwner={true}
              onRefresh={() => fetchProfile(user.uid)}
            />
          </div>
        </div>

      </main>
    </div>
  );
}
