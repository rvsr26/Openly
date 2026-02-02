"use client";
import { loginWithGoogle, logout } from "../firebase";
import { useQuery } from "@tanstack/react-query";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import api, { getAbsUrl } from "../lib/api";

import {
  UserCircle,
  LogOut,
  Award,
  PlusCircle,
  Bell,
  Bookmark,
  Moon,
  Sun,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const router = useRouter();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      const res = await api.get(
        `/users/${authUser.uid}/profile`
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
    <nav className="glass-premium fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-[1600px] z-50 rounded-2xl transition-all duration-300">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/assets/logo.png"
              alt="Openly"
              className="h-8 w-auto object-contain transition-transform group-hover:rotate-6"
            />
          </Link>

          {/* CENTER: SEARCH BAR */}
          <div className="flex-1 flex justify-center px-4 md:px-8">
            <div className="w-full max-w-md transition-all focus-within:max-w-lg duration-500">
              <SearchBar />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* THEME TOGGLE */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all active:scale-90"
            >
              {mounted && theme === "dark" ? (
                <Sun size={18} className="fill-yellow-500 text-yellow-500" />
              ) : (
                <Moon size={18} className="fill-indigo-600 text-indigo-600 dark:text-indigo-400" />
              )}
            </button>

            {isAuthLoading ? (
              <div className="h-10 w-28 bg-primary/5 animate-pulse rounded-full" />
            ) : authUser ? (
              <div className="flex items-center gap-2 md:gap-4">

                {/* CREATE POST */}
                <button
                  onClick={handleCreatePost}
                  className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold premium-shadow hover:brightness-110 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  <PlusCircle size={18} />
                  <span>Create</span>
                </button>
                {/* Mobile Create Icon Only */}
                <button
                  onClick={handleCreatePost}
                  className="md:hidden p-2.5 text-primary hover:bg-primary/10 rounded-xl active:scale-90 transition"
                >
                  <PlusCircle size={24} />
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {/* NETWORK */}
                  <Link
                    href="/network"
                    title="My Network"
                    className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all active:scale-95"
                  >
                    <Users size={18} />
                  </Link>

                  {/* BOOKMARKS */}
                  <Link
                    href="/bookmarks"
                    title="Bookmarks"
                    className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all active:scale-95"
                  >
                    <Bookmark size={18} />
                  </Link>

                  {/* NOTIFICATIONS */}
                  <Link
                    href="/notifications"
                    title="Notifications"
                    className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all active:scale-95"
                  >
                    <Bell size={18} />
                  </Link>
                </div>

                {/* REPUTATION */}
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary rounded-lg border border-primary/10 hover:border-primary/30 transition-colors cursor-help" title="Your Reputation Score">
                  <Award size={16} className="fill-primary/20" />
                  <span className="text-xs font-black">
                    {profile?.stats?.reputation ?? 0}
                  </span>
                </div>

                {/* PROFILE */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-1 hover:bg-primary/5 rounded-full transition-all border border-transparent hover:border-primary/10 group"
                  title="Your Profile"
                >
                  <div className="relative">
                    <img
                      src={getAbsUrl(profile?.user_info?.photoURL || authUser.photoURL)}
                      alt="My Profile"
                      className="h-8 w-8 rounded-full ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all object-cover"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full"></div>
                  </div>

                  <span className="hidden lg:block text-xs font-bold text-foreground max-w-[80px] truncate">
                    @{username || "user"}
                  </span>
                </Link>

                {/* LOGOUT */}
                <button
                  onClick={logout}
                  className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all active:scale-95"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/login")}
                  className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors px-4 py-2 hover:bg-primary/5 rounded-full"
                >
                  Login
                </button>

                <button
                  onClick={loginWithGoogle}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-xs font-black premium-shadow hover:brightness-110 transition-all active:scale-95"
                >
                  SIGN IN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
