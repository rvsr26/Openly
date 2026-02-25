"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../lib/api";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { Post } from "../../types";

import ProfileHeader from "../ProfileHeader";
import ProfileStats from "../ProfileStats";
import ProfileTabs from "../ProfileTabs";
import ProfileContent from "../ProfileContent";

export default function PublicProfile() {
  const params = useParams();
  const userId = params.id as string;
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  // Resolve Firebase auth first
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const fetchProfile = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const requesterId = auth.currentUser?.uid;
      const res = await api.get(`/users/${userId}/profile${requesterId ? `?requester_id=${requesterId}` : ''}`);
      setProfile(res.data);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId || userId === "undefined") {
      setLoading(false);
      return;
    }
    if (!authReady) return; // wait for auth to settle
    fetchProfile();
  }, [userId, authReady]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground animate-pulse">
      Loading profile…
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-background flex justify-center items-center">
      <div className="glass-card p-8 text-center rounded-2xl border border-border">
        <h2 className="text-2xl font-bold text-foreground">User not found</h2>
      </div>
    </div>
  );

  const isOwnProfile = currentUser?.uid === userId;

  return (
    <div className="min-h-screen pb-20">

      <main className="mt-20 max-w-6xl mx-auto px-4 pt-10">
        <ProfileHeader
          user={currentUser || { uid: userId, displayName: profile.user_info.display_name }}
          profileData={profile}
          isOwner={isOwnProfile}
          onRefresh={() => fetchProfile(true)}
        />

        <div className="grid grid-cols-1 gap-8">
          <div className="w-full">
            <ProfileStats stats={profile.stats} userId={profile.user_info.id} />
            <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <ProfileContent
              activeTab={activeTab}
              posts={profile.posts}
              user={profile.user_info}
              isOwner={isOwnProfile}
              onRefresh={() => { }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}