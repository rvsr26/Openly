"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import PostItem from './components/PostItem'; 
import { auth } from './firebase'; 
import { onAuthStateChanged, User } from 'firebase/auth'; 
import Link from 'next/link'; // <--- IMPORT THIS

interface Post {
  id: string;
  content: string;
  author: string;
  author_pic?: string;
  category: string;
  view_count?: number;
  reaction_count?: number;
  image_url?: string;
}

const CATEGORIES = ["All", "Career", "Startup", "Academic", "Relationship", "Health"];

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");

useEffect(() => { 
  fetchFeed("All"); 
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
        // FETCH USERNAME FOR SIDEBAR
        try {
            const res = await axios.get(`http://127.0.0.1:8000/users/${currentUser.uid}/profile`);
            if (res.data.user_info?.username) {
                setUsername(res.data.user_info.username);
            }
        } catch(e) { console.error(e); }
    }
  });
  return () => unsubscribe();
}, []);

  const fetchFeed = async (category: string) => {
    try {
      let url = 'http://127.0.0.1:8000/feed/';
      if (category !== "All") url += `?category=${category}`;
      const res = await axios.get(url);
      setPosts(res.data);
      setActiveFilter(category);
    } catch (error) {
      console.error("Error fetching feed:", error);
    }
  };

  const handleSubmit = async () => {
    if (!user) return; 
    
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/posts/', {
        content: content,
        user_id: user.uid,
        user_name: user.displayName, 
        user_pic: user.photoURL,
        is_anonymous: isAnonymous
      });

      if (res.data.status === "rejected_for_toxicity") {
        alert("⚠️ Post Submitted but Flagged.\n\nYour post was detected as toxic by AI and will be hidden from the public feed.");
      } 
      
      setContent('');
      fetchFeed(activeFilter); 
      
    } catch (error) {
      console.error(error);
      alert("System Error: Could not connect to backend.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF]"> 
      <Navbar />
      
      <main className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
        
        {/* LEFT SIDEBAR - PROFILE CARD */}
        <div className="hidden md:block w-64 flex-shrink-0">
          {user ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden sticky top-24">
              <div className="h-16 bg-gray-600"></div>
              <div className="px-4 pb-4">
                <div className="relative -mt-8 mb-3">
            <div className="h-16 w-16 rounded-full bg-gray-200 border-2 border-white overflow-hidden flex items-center justify-center">
                <img src={user.photoURL || "https://via.placeholder.com/150"} alt="" />
            </div>
            </div>

            {/* --- UPDATED NAME SECTION --- */}
                <h2 className="text-lg font-bold truncate">
                {username ? `@${username}` : user.displayName}
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                {username ? user.displayName : "Failure Survivor"}
                </p>
                
                {/* --- NEW: VIEW PROFILE BUTTON --- */}
                <Link href="/profile">
                  <button className="w-full border border-blue-600 text-blue-600 font-semibold text-sm py-1 rounded-full hover:bg-blue-50 transition">
                    View Profile
                  </button>
                </Link>
                {/* ------------------------------- */}

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-4 sticky top-24">
              <h2 className="font-bold text-gray-800">New here?</h2>
              <p className="text-sm text-gray-600 mt-2">Sign in to share your story.</p>
            </div>
          )}
        </div>

        {/* CENTER FEED */}
        <div className="flex-1 max-w-xl">
          
          {/* CREATE POST BOX */}
          {user ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-4 mb-4">
              <div className="flex gap-3 mb-3">
                <img src={user.photoURL || "https://via.placeholder.com/40"} className="w-12 h-12 rounded-full"/>
                <textarea
                  className="w-full border border-gray-300 rounded-full px-4 py-3 focus:outline-none hover:bg-gray-100 transition resize-none h-12 overflow-hidden"
                  placeholder="Share your failure story..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center pl-14">
                <label className="flex items-center space-x-2 text-gray-500 text-sm cursor-pointer select-none">
                   <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}/>
                   <span>Post Anonymously</span>
                </label>
                <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-1 rounded-full font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6 mb-4 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Have a failure to share?</h3>
              <p className="text-gray-500 mb-4">Join the community to post anonymously and get support.</p>
              <div className="bg-gray-100 p-3 rounded text-sm text-gray-600">
                Login via the top right corner to start posting.
              </div>
            </div>
          )}

          {/* FILTER BUTTONS */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
             {CATEGORIES.map(cat => (
               <button key={cat} onClick={() => fetchFeed(cat)} 
                 className={`px-3 py-1 rounded-full text-sm font-semibold border transition-colors ${activeFilter === cat ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-600 border-gray-400 hover:bg-gray-50"}`}>
                 {cat}
               </button>
             ))}
          </div>

          {/* POSTS LIST */}
          <div>
            {posts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
            {posts.length === 0 && (
                <div className="text-center py-10 text-gray-500">No posts in this category yet.</div>
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR (News) */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-4 sticky top-24">
             <h3 className="font-semibold text-sm mb-3 text-gray-900">Failure News</h3>
             <ul className="space-y-4">
               <li className="text-xs text-gray-600">
                 <span className="font-bold block text-gray-800 hover:text-blue-600 cursor-pointer">Why 90% of AI startups fail</span>
                 Top news • 10,234 readers
               </li>
               <li className="text-xs text-gray-600">
                 <span className="font-bold block text-gray-800 hover:text-blue-600 cursor-pointer">Dealing with Academic Burnout</span>
                 Education • 5,122 readers
               </li>
             </ul>
          </div>
        </div>

      </main>
    </div>
  );
}