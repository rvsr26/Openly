"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../lib/api";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import Navbar from "../../components/Navbar";
import { Post } from "../../types";

import ProfileHeader from "../../profile/ProfileHeader";
import ProfileStats from "../../profile/ProfileStats";
import ProfileTabs from "../../profile/ProfileTabs";
import ProfileContent from "../../profile/ProfileContent";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!username || username === "undefined") {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const requesterId = auth.currentUser?.uid;
        // The backend `/users/{id}/profile` now supports username via `get_user_by_any_id`
        const res = await api.get(`/users/${username}/profile${requesterId ? `?requester_id=${requesterId}` : ''}`);
        setProfile(res.data);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

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

  const isOwnProfile = currentUser?.uid === profile.user_info.id;

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <Navbar />

      <main className="mt-20 max-w-6xl mx-auto px-4 pt-10">
        <ProfileHeader
          user={currentUser || { uid: profile.user_info.id, displayName: profile.user_info.display_name }}
          profileData={profile}
          isOwner={isOwnProfile}
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
              onRefresh={() => {
                const requesterId = auth.currentUser?.uid;
                api.get(`/users/${username}/profile${requesterId ? `?requester_id=${requesterId}` : ''}`).then(res => setProfile(res.data));
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
