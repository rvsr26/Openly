"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar'; 
import PostItem from '../components/PostItem';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link'; // Import Link

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    // 1. Wait for Auth to confirm who is logged in
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.uid);
      } else {
        setLoading(false); // Not logged in
      }
    });
    return () => unsubscribe();
  }, []);

// Inside fetchProfile function in ProfilePage

const fetchProfile = async (uid: string) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/users/${uid}/profile`);
      
      // 1. Check if backend returned valid data
      if (!res.data || !res.data.user_info) {
         console.log("Profile data missing, user might need setup.");
         // Don't redirect automatically yet, let's see the error first
         setProfileData(null);
      } 
      // 2. Check for Username (The Trap)
      else if (!res.data.user_info.username) {
         window.location.href = "/setup-username";
         return; // Redirecting...
      } else {
         setProfileData(res.data);
      }

    } catch (error) {
      console.error("Error loading profile:", error);
      alert("Backend Error: Check your console.");
    } finally {
      // 3. FORCE LOADING TO STOP
      setLoading(false);
    }
  };;

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;

  if (!user) return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
          <p className="text-gray-600 mt-2">Please login to view your profile.</p>
        </div>
      </div>
    </div>
  );
  console.log("DEBUG PROFILE DATA:", profileData);

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />
      {/* ... inside the return statement ... */}

{/* Name & Title */}
<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
  {user.displayName}
  
  {/* --- READ FROM DATABASE (profileData), NOT AUTH (user) --- */}
  {profileData && profileData.user_info && profileData.user_info.username && (
    <span className="text-xl font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md text-sm">
      @{profileData.user_info.username}
    </span>
  )}
</h1>

<p className="text-gray-500 text-lg">Failure Survivor</p>

{/* ... Rest of stats ... */}
      
      <main className="pt-24 max-w-4xl mx-auto px-4 pb-10">
        
        {/* --- NEW: BACK TO GLOBAL FEED BUTTON --- */}
        <div className="mb-4">
          <Link href="/" className="flex items-center text-gray-500 hover:text-blue-600 transition font-medium w-fit">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Global Feed
          </Link>
        </div>
        {/* --------------------------------------- */}

        {/* --- SECTION 1: THE DASHBOARD HEADER --- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden mb-6 relative">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-slate-700 to-slate-900"></div>
          
          <div className="px-8 pb-8">
            {/* User Avatar */}
            <div className="relative -mt-16 mb-4 flex justify-between items-end">
              <img 
                src={user.photoURL || "https://via.placeholder.com/150"} 
                className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-white"
              />
            </div>

            {/* Name & Title */}
            <h1 className="text-3xl font-bold text-gray-900">{user.displayName}</h1>
            <p className="text-gray-500 text-lg">Failure Survivor</p>
            
            {/* STATS ROW (The Gamification Part) */}
            <div className="flex gap-8 mt-6 border-t border-gray-100 pt-6">
              <div>
                <span className="block text-3xl font-bold text-gray-900">
                  {profileData?.stats.reputation || 0}
                </span>
                <span className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Reputation Score</span>
              </div>
              <div>
                <span className="block text-3xl font-bold text-gray-900">
                  {profileData?.stats.total_posts || 0}
                </span>
                <span className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Failures Shared</span>
              </div>
              <div>
                <span className="block text-3xl font-bold text-gray-900">
                  {profileData?.stats.total_views || 0}
                </span>
                <span className="text-sm text-gray-500 uppercase tracking-wide font-semibold">People Impacted</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: YOUR PAST POSTS --- */}
        <div className="flex gap-6">
          
          {/* Left Sidebar: About */}
          <div className="hidden md:block w-1/3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6 mb-4">
              <h3 className="font-bold text-lg mb-4">About</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                This is your personal space. Review your past failures and see how much you have grown.
              </p>
            </div>
          </div>

          {/* Right Content: Your Activity */}
          <div className="w-full md:w-2/3">
            <h3 className="text-xl font-bold text-gray-800 mb-4">My Activity</h3>
            
            {profileData?.posts.length === 0 && (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-300 text-gray-500">
                You haven't posted any failures yet.
              </div>
            )}

            {profileData?.posts.map((post: any) => (
               <div key={post.id}>
                  {/* Warning for Rejected Posts */}
                  {post.is_rejected && (
                    <div className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2 rounded-t-lg border-x border-t border-red-200 mt-4">
                      ⚠ This post was flagged by AI and is hidden from the public.
                    </div>
                  )}
                  {/* Reuse the Post Component */}
                  <PostItem post={post} />
               </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}