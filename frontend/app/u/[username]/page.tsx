"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "../../lib/api";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";

import ProfileHeader from "../../profile/ProfileHeader";
import ProfileStats from "../../profile/ProfileStats";
import ProfileTabs from "../../profile/ProfileTabs";
import ProfileContent from "../../profile/ProfileContent";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  // Wait for auth to resolve before we know who the requester is
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  // Step 1: Resolve auth first
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);  // auth is now settled (user or null)
    });
    return () => unsubscribe();
  }, []);

  // Step 2: Only fetch profile once auth is ready
  const fetchProfile = async (silent = false) => {
    if (!username || username === "undefined") {
      setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      const requesterId = auth.currentUser?.uid;
      const res = await api.get(`/users/${username}/profile${requesterId ? `?requester_id=${requesterId}` : ''}`);
      setProfile(res.data);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) return; // wait for auth to settle
    fetchProfile();
  }, [username, authReady]);

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

  const isOwnProfile = currentUser?.uid === profile.user_info.id ||
    currentUser?.uid === profile.user_info.uid;

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <main className="mt-20 max-w-6xl mx-auto px-4 pt-10">
        <ProfileHeader
          user={currentUser || { uid: profile.user_info.id, displayName: profile.user_info.display_name }}
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
              onRefresh={() => fetchProfile(true)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
