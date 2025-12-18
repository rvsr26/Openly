"use client";
import { loginWithGoogle, logout, auth } from "../firebase"; 
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link"; 
import axios from "axios";

// 1. IMPORT THE SEARCH BAR (This is what you are missing)
import SearchBar from "./SearchBar"; 

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const res = await axios.get(`http://127.0.0.1:8000/users/${currentUser.uid}/profile`);
          if (res.data.user_info && res.data.user_info.username) {
            setUsername(res.data.user_info.username);
          }
        } catch (e) {
          console.error("Navbar fetch error", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    await loginWithGoogle();
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* LEFT: LOGO */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="cursor-pointer">
              <h1 className="text-2xl font-bold text-gray-900">
                Failure<span className="text-red-600">In</span>
              </h1>
            </Link>
          </div>

          {/* CENTER: SEARCH BAR (This puts the component on screen) */}
          <div className="flex-1 flex justify-center px-8">
            <div className="w-full max-w-lg">
                <SearchBar />
            </div>
          </div>
          
          {/* RIGHT: AUTH BUTTONS */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {user ? (
              <>
                <Link href="/profile" className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full border border-gray-300"
                  />
                  <span className="text-sm font-bold text-gray-700 hidden md:block">
                    {username ? `@${username}` : user.displayName}
                  </span>
                </Link>
                <button 
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-900 font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}