"use client";

import { loginWithGoogle, logout } from "../firebase";
import { useQuery } from "@tanstack/react-query";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import {
  UserCircle,
  LogOut,
  Award,
  PlusCircle,
  Bell,
  Bookmark
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  /* 🔐 Auth listener */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /* 👤 Fetch profile */
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile", authUser?.uid],
    queryFn: async () => {
      if (!authUser) return null;
      const res = await axios.get(
        `http://127.0.0.1:8000/users/${authUser.uid}/profile`
      );
      return res.data;
    },
    enabled: !!authUser,
    staleTime: 1000 * 60 * 5,
  });

  /* 🚨 Force username setup */
  useEffect(() => {
    if (!isProfileLoading && authUser && !profile?.user_info?.username) {
      if (window.location.pathname !== "/setup-username") {
        router.push("/setup-username");
      }
    }
  }, [profile, authUser, isProfileLoading, router]);

  /* ➕ Create Post */
  const handleCreatePost = () => {
    if (!authUser) router.push("/login");
    else router.push("/create-post");
  };

  const username = profile?.user_info?.username;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* LOGO */}
          <Link href="/" className="group flex items-center gap-1">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              Failure
              <span className="text-red-600 group-hover:animate-pulse">
                In
              </span>
            </h1>
          </Link>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            {isAuthLoading ? (
              <div className="h-8 w-28 bg-gray-100 animate-pulse rounded-full" />
            ) : authUser ? (
              <div className="flex items-center gap-2 md:gap-3">

                {/* CREATE POST */}
                <button
                  onClick={handleCreatePost}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-500 transition shadow-sm active:scale-95"
                >
                  <PlusCircle size={16} />
                  <span className="hidden sm:inline">Create</span>
                </button>

                {/* BOOKMARKS */}
                <Link
                  href="/bookmarks"
                  title="Bookmarks"
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <Bookmark size={20} />
                </Link>

                {/* NOTIFICATIONS (future-ready) */}
                <Link
                  href="/notifications"
                  title="Notifications"
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <Bell size={20} />
                </Link>

                {/* REPUTATION */}
                <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                  <Award size={14} className="fill-amber-500" />
                  <span className="text-xs font-bold">
                    {profile?.stats?.reputation ?? 0}
                  </span>
                </div>

                {/* PROFILE */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-50 rounded-full transition border border-transparent hover:border-gray-100"
                >
                  {authUser.photoURL ? (
                    <img
                      src={authUser.photoURL}
                      alt="User"
                      className="h-8 w-8 rounded-full ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <UserCircle className="h-8 w-8 text-gray-400" />
                  )}

                  <span className="hidden md:block text-sm font-bold text-gray-800">
                    @{username || "user"}
                  </span>
                </Link>

                {/* LOGOUT */}
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm font-semibold text-gray-700 hover:text-black"
                >
                  Login
                </button>

                <button
                  onClick={loginWithGoogle}
                  className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition shadow-sm active:scale-95"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
