"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import PostItem from "../../components/PostItem";
import { useParams } from "next/navigation";

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/users/username/${username}`
        );
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load public profile", err);
        setError("User not found");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading profile...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />

      <main className="pt-24 max-w-4xl mx-auto px-4 pb-10">
        {/* HEADER */}
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={profile.user_info.photo || "https://via.placeholder.com/100"}
              className="w-20 h-20 rounded-full border"
            />

            <div>
              <h1 className="text-2xl font-bold">
                {profile.user_info.display_name}
              </h1>
              <p className="text-gray-500">@{profile.user_info.username}</p>
              {profile.user_info.bio && (
                <p className="text-sm text-gray-600 mt-2">
                  {profile.user_info.bio}
                </p>
              )}
            </div>
          </div>

          {/* STATS */}
          <div className="flex gap-6 mt-6 border-t pt-4">
            <div>
              <span className="block text-xl font-bold">
                {profile.stats.total_posts}
              </span>
              <span className="text-xs text-gray-500">Posts</span>
            </div>
            <div>
              <span className="block text-xl font-bold">
                {profile.stats.total_views}
              </span>
              <span className="text-xs text-gray-500">Views</span>
            </div>
            <div>
              <span className="block text-xl font-bold">
                {profile.stats.reputation}
              </span>
              <span className="text-xs text-gray-500">Reputation</span>
            </div>
          </div>
        </div>

        {/* POSTS */}
        <h2 className="text-xl font-bold mb-4">Failures Shared</h2>

        {profile.posts.length === 0 && (
          <div className="bg-white border rounded-lg p-6 text-center text-gray-500">
            No public posts yet.
          </div>
        )}

        <div className="space-y-6">
          {profile.posts.map((post: any) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}
