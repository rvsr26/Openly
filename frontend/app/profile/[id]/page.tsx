"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // <--- This gets the ID from URL
import axios from "axios";
import api from "../../lib/api";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { MessageCircle } from "lucide-react";

import Navbar from "../../components/Navbar";
import { Post } from "../../types";

export default function PublicProfile() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id; // The user ID from the URL
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [profile, setProfile] = useState<{
    user_info: {
      display_name?: string;
      username?: string;
    };
    stats: {
      total_posts: number;
      total_views: number;
    };
    posts: Post[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        // Fetch specific user data
        const res = await api.get(`/users/${userId}/profile`);
        setProfile(res.data);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleSendMessage = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    router.push(`/messages?user=${userId}`);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center">Loading...</div>;

  if (!profile) return <div className="min-h-screen bg-gray-50 flex justify-center items-center">User not found.</div>;

  const isOwnProfile = currentUser?.uid === userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto py-10 px-4 pt-24">
        {/* HEADER CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
          <img
            src={profile.posts[0]?.user_pic || "/assets/default_avatar.png"}
            alt={`${profile.user_info.display_name || "User"}'s profile`}
            className="w-24 h-24 rounded-full border-4 border-gray-100"
          />
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {profile.user_info.display_name || "Anonymous User"}
            </h1>
            <p className="text-gray-500 font-medium text-lg">
              @{profile.user_info.username || "ghost"}
            </p>

            {/* STATS ROW */}
            <div className="flex gap-6 mt-4 justify-center md:justify-start">
              <div className="text-center">
                <span className="block text-xl font-bold text-gray-900">{profile.stats.total_posts}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Stories</span>
              </div>

              <div className="text-center">
                <span className="block text-xl font-bold text-gray-900">{profile.stats.total_views}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Views</span>
              </div>
            </div>
          </div>

          {/* Send Message Button */}
          {!isOwnProfile && currentUser && (
            <button
              onClick={handleSendMessage}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
            >
              <MessageCircle size={20} />
              Send Message
            </button>
          )}
        </div>

        {/* POSTS FEED */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Posted Stories</h2>

        <div className="space-y-4">
          {profile.posts.length === 0 && (
            <p className="text-gray-500">This user hasn&apos;t shared any public stories yet.</p>
          )}

          {profile.posts.map((post: Post) => (
            <div key={post.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full uppercase font-bold">
                  {post.category}
                </span>
                <span className="text-gray-400 text-sm">
                  {post.created_at ? new Date(post.created_at).toLocaleDateString() : "Just now"}
                </span>
              </div>
              <p className="text-gray-800 text-lg leading-relaxed">{post.content}</p>

              <div className="mt-4 flex items-center gap-6 text-gray-500 text-sm border-t border-gray-50 pt-3">
                <span>👁️ {post.view_count} Views</span>
                <span>✊ {post.reaction_count || 0} Respects</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}