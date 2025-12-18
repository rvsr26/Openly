"use client";
import { loginWithGoogle, logout } from "../firebase";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import Link from "next/link"; 
import axios from "axios";    

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string>(""); // <--- NEW STATE

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // IF LOGGED IN, FETCH USERNAME IMMEDIATELY
      if (currentUser) {
        try {
          const res = await axios.get(`http://127.0.0.1:8000/users/${currentUser.uid}/profile`);
          if (res.data.user_info && res.data.user_info.username) {
            setUsername(res.data.user_info.username);
          } else {
            // If no username found, force setup (Optional, keeps your trap active)
            if (window.location.pathname !== "/setup-username") {
               window.location.href = "/setup-username";
            }
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
    // The useEffect above will handle the fetching/redirecting after login
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          <div className="flex items-center">
            <Link href="/" className="cursor-pointer">
              <h1 className="text-2xl font-bold text-gray-900">
                Failure<span className="text-red-600">In</span>
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/profile" className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full border border-gray-300"
                  />
                  <span className="text-sm font-bold text-gray-700 hidden md:block">
                    {/* SHOW USERNAME IF AVAILABLE, ELSE NAME */}
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
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}