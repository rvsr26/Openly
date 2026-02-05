"use client";
import { loginWithGoogle, logout } from "../firebase";
import { useQuery } from "@tanstack/react-query";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect, useCallback, memo, useRef } from "react";
import Link from "next/link";
import api, { getAbsUrl } from "../lib/api";

import {
  Bell,
  Users,
  Search,
  Plus,
  MessageCircle,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const { theme } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["userProfile", authUser?.uid],
    queryFn: async () => {
      if (!authUser) return null;
      const res = await api.get(`/users/${authUser.uid}/profile`);
      return res.data;
    },
    enabled: !!authUser,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["unreadMessages", authUser?.uid],
    queryFn: async () => {
      if (!authUser) return { unread_count: 0 };
      const res = await api.get(`/users/${authUser.uid}/unread-count`);
      return res.data;
    },
    enabled: !!authUser,
    refetchInterval: 5000,
  });

  const handleCreatePost = useCallback(() => {
    if (!authUser) router.push("/login");
    else router.push("/create-post");
  }, [authUser, router]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled
        ? "glass-premium shadow-xl shadow-black/5"
        : "bg-transparent"
      }`}>
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-4">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-1.5 sm:p-2 flex items-center justify-center shadow-lg shadow-primary/25"
            >
              <div className="w-full h-full bg-white rounded-xl"></div>
            </motion.div>
            <span className="text-lg sm:text-xl lg:text-2xl font-black text-foreground tracking-tighter">
              Openly
            </span>
          </Link>

          {/* SEARCH BAR (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md lg:max-w-xl mx-4 lg:mx-8">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search people, insights..."
                className="w-full input-field pl-11 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">

            {/* Create Post Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreatePost}
              className="hidden sm:flex items-center gap-2 px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">Create</span>
            </motion.button>

            {/* Mobile Create Button */}
            <button
              onClick={handleCreatePost}
              className="sm:hidden p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Divider */}
            <div className="hidden sm:block h-8 w-px bg-border/50"></div>

            {/* Icons (Desktop) */}
            <div className="hidden sm:flex items-center gap-1 lg:gap-2">
              <Link
                href="/messages"
                className="relative p-2 lg:p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadCount && unreadCount.unread_count > 0 && (
                  <span className="absolute top-1 right-1 bg-primary text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold ring-2 ring-background">
                    {unreadCount.unread_count > 9 ? '9+' : unreadCount.unread_count}
                  </span>
                )}
              </Link>

              <Link
                href="/notifications"
                className="p-2 lg:p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
              >
                <Bell className="w-5 h-5" />
              </Link>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-border/50"></div>

            {/* User Menu */}
            {authUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 sm:gap-3 p-1 pl-2 sm:pl-3 rounded-2xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/50"
                >
                  <span className="hidden lg:inline text-xs font-bold text-foreground max-w-[100px] truncate">
                    {profile?.user_info?.display_name || authUser.displayName || 'User'}
                  </span>
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl overflow-hidden ring-2 ring-primary/20">
                    <img
                      src={getAbsUrl(profile?.user_info?.photoURL || authUser.photoURL)}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  </div>
                  <ChevronDown className={`hidden sm:block w-4 h-4 text-muted-foreground transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 sm:w-64 glass-premium rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                        <p className="text-sm font-bold text-foreground truncate">
                          {profile?.user_info?.display_name || authUser.displayName || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {authUser.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <span>View Profile</span>
                        </Link>

                        <Link
                          href="/settings"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      <div className="border-t border-border/50">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 sm:px-5 py-2 text-xs font-bold text-foreground hover:text-primary transition-colors uppercase border border-border rounded-xl hover:border-primary/50"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 text-foreground hover:bg-muted/50 rounded-xl transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden border-t border-border/50 py-4 space-y-2"
            >
              <Link
                href="/messages"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 rounded-xl transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Messages</span>
                {unreadCount && unreadCount.unread_count > 0 && (
                  <span className="ml-auto bg-primary text-white text-xs rounded-full px-2 py-0.5 font-bold">
                    {unreadCount.unread_count}
                  </span>
                )}
              </Link>

              <Link
                href="/notifications"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </Link>

              <div className="relative px-4 py-2">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full input-field pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

export default memo(Navbar);
