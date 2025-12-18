"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import PostItem from "../components/PostItem";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState("");

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      fetchProfile(currentUser.uid);
    });

    return () => unsubscribe();
  }, []);

  /* ---------------- FETCH PROFILE ---------------- */
  const fetchProfile = async (uid: string) => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/users/${uid}/profile`
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

  /* ---------------- STATES ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F2EF]">
        Loading profile…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F3F2EF]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Access Denied
            </h2>
            <p className="text-gray-600 mt-2">
              Please login to view your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F2EF]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  const username = profileData?.user_info?.username;

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />

      <main className="pt-24 max-w-5xl mx-auto px-4 pb-12">
        {/* BACK */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-500 hover:text-blue-600 font-medium mb-4"
        >
          ← Back to Global Feed
        </Link>

        {/* HEADER CARD */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-slate-700 to-slate-900"></div>

          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-4 flex justify-between items-end">
              <img
                src={user.photoURL || "https://via.placeholder.com/150"}
                className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-white"
              />

              {/* ACTIONS */}
              <div className="flex gap-2">
                <Link
                  href="/profile/edit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg border bg-gray-100 hover:bg-gray-200"
                >
                  Edit Profile
                </Link>

                {username && (
                  <Link
                    href={`/u/${username}`}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    View Public
                  </Link>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {user.displayName}
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                @{username}
              </span>
            </h1>

            <p className="text-gray-500 text-lg">Failure Survivor</p>

            {/* STATS */}
            <div className="flex gap-8 mt-6 border-t border-gray-100 pt-6">
              <Stat
                label="Reputation"
                value={profileData.stats.reputation}
              />
              <Stat
                label="Failures Shared"
                value={profileData.stats.total_posts}
              />
              <Stat
                label="People Impacted"
                value={profileData.stats.total_views}
              />
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex gap-6">
          {/* ABOUT */}
          <div className="hidden md:block w-1/3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
              <h3 className="font-bold text-lg mb-4">About</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                This is your personal space. Review your past failures
                and track how many people your story has helped.
              </p>
            </div>
          </div>

          {/* POSTS */}
          <div className="w-full md:w-2/3">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              My Activity
            </h3>

            {profileData.posts.length === 0 && (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-300 text-gray-500">
                You haven’t posted any failures yet.
              </div>
            )}

            {profileData.posts.map((post: any) => (
              <div key={post.id}>
                {post.is_rejected && (
                  <div className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2 rounded-t-lg border border-red-200 mt-4">
                    ⚠ This post was flagged by AI and hidden from public feed.
                  </div>
                )}
                <PostItem post={post} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- STAT COMPONENT ---------------- */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="block text-3xl font-bold text-gray-900">
        {value || 0}
      </span>
      <span className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
        {label}
      </span>
    </div>
  );
}
