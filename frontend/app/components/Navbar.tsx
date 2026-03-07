"use client";
import { loginWithGoogle, logout } from "../firebase";
import { useQuery } from "@tanstack/react-query";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect, useCallback, memo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import api, { getAbsUrl } from "@/app/lib/api";
import { getStoredAccounts, saveAccount, removeAccount } from "@/app/lib/accountUtils";

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
  X,
  Home,
  Bookmark,
  PenTool
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import SearchAutocomplete from './SearchAutocomplete';

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, refreshSession } = useAuth();
  const { theme } = useTheme();

  // All hooks must be called before any conditional returns
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const savedDropdownRef = useRef<HTMLDivElement>(null);
  const [storedAccounts, setStoredAccounts] = useState<any[]>([]);

  // All useEffect hooks must also be before conditional returns
  useEffect(() => {
    if (showDropdown) {
      const accounts = getStoredAccounts();
      setTimeout(() => setStoredAccounts(accounts), 0);
    }
  }, [showDropdown]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(prev => prev === scrolled ? prev : scrolled);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (savedDropdownRef.current && !savedDropdownRef.current.contains(event.target as Node)) {
        setShowSavedDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Move hooks here to satisfy Rules of Hooks
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

  // Real-time notification badge via WebSocket
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const WSURL = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? `ws://${window.location.hostname}:8001` : '');

  useEffect(() => {
    if (!authUser) return;
    const ws = new WebSocket(`${WSURL}/ws/${authUser.uid}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // Any notification event increments the badge
        if (data.type && !['message', 'typing'].includes(data.type)) {
          setUnreadNotifs(prev => prev + 1);
        }
      } catch { }
    };
    ws.onerror = () => { }; // silent fail — WS is enhancement only
    return () => { ws.readyState === WebSocket.OPEN && ws.close(); };
  }, [authUser?.uid]);

  const handleCreatePost = useCallback(() => {
    if (!authUser) router.push("/login");
    else router.push("/create-post");
  }, [authUser, router]);

  // Hide navbar on special pages (now managed by Providers.tsx)
  const hiddenPaths = ['/landing', '/login', '/signup', '/auth/mfa'];
  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  const handleAddAccount = async () => {
    if (authUser) {
      const currentToken = localStorage.getItem('token');
      saveAccount(authUser, currentToken === "null" || currentToken === "undefined" ? null : currentToken);
    }
    await logout();
    setShowDropdown(false);
    router.push("/login");
  };

  const handleSwitchAccount = async (account: any) => {
    if (authUser) {
      const currentToken = localStorage.getItem('token');
      saveAccount(authUser, currentToken === "null" || currentToken === "undefined" ? null : currentToken);
    }

    if (account.token && account.token !== "null" && account.token !== "undefined") {
      localStorage.setItem('token', account.token);
    } else {
      localStorage.removeItem('token');
    }

    await refreshSession();
    setShowDropdown(false);
  };

  const handleRemoveAccount = (uid: string) => {
    removeAccount(uid);
    setStoredAccounts(getStoredAccounts());
  };


  const handleLogout = async () => {
    try {
      if (authUser) {
        const currentToken = localStorage.getItem('token');
        saveAccount(authUser, currentToken === "null" || currentToken === "undefined" ? null : currentToken);
      }
      await logout();
      localStorage.removeItem('token');
      await refreshSession();
      setShowDropdown(false);
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled
      ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
      : "bg-background/80 backdrop-blur-sm border-b border-border/50"
      }`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <Link href={authUser ? "/feed" : "/"} className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <div className="w-5 h-5 bg-white rounded-md"></div>
            </div>
            <span className="text-xl font-bold text-foreground">
              Openly
            </span>
          </Link>

          {/* SEARCH BAR (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md lg:max-w-xl mx-8">
            <SearchAutocomplete />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Create Post Button */}
            <button
              onClick={handleCreatePost}
              className="hidden sm:flex items-center gap-2 btn-primary text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">Create</span>
            </button>

            {/* Mobile Create Button */}
            <button
              onClick={handleCreatePost}
              className="sm:hidden btn-icon"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Divider */}
            <div className="hidden sm:block h-6 divider-vertical"></div>

            {/* Icons (Desktop) */}
            <div className="hidden sm:flex items-center gap-1">
              <Link href="/feed" className="btn-icon" title="Home">
                <Home className="w-5 h-5" />
              </Link>

              <Link href="/communities" className="btn-icon" title="Communities">
                <Users className="w-5 h-5" />
              </Link>

              <div className="relative" ref={savedDropdownRef}>
                <button
                  onClick={() => setShowSavedDropdown(!showSavedDropdown)}
                  className="btn-icon"
                  title="Saved Content"
                >
                  <Bookmark className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showSavedDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 card-elevated rounded-xl overflow-hidden z-[60]"
                    >
                      <div className="py-1">
                        <Link
                          href="/drafts"
                          onClick={() => setShowSavedDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <PenTool className="w-4 h-4 text-muted-foreground" />
                          <span>Drafts</span>
                        </Link>
                        <Link
                          href="/bookmarks"
                          onClick={() => setShowSavedDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-muted-foreground" />
                          <span>Bookmarks</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/messages" className="btn-icon relative">
                <MessageCircle className="w-5 h-5" />
                {unreadCount && unreadCount.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unreadCount.unread_count > 9 ? '9+' : unreadCount.unread_count}
                  </span>
                )}
              </Link>

              <Link href="/notifications" className="btn-icon relative" onClick={() => setUnreadNotifs(0)}>
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </Link>

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>

            {/* Divider */}
            <div className="h-6 divider-vertical"></div>

            {/* User Menu */}
            {authUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-muted/50 transition-all"
                >
                  <span className="hidden lg:inline text-sm font-medium text-foreground max-w-[100px] truncate">
                    {profile?.user_info?.display_name || authUser.displayName || 'User'}
                  </span>
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-2 ring-border">
                    <img
                      src={getAbsUrl(profile?.user_info?.photoURL || authUser.photoURL)}
                      className="object-cover w-8 h-8"
                      onError={(e) => { if (!e.currentTarget.src.includes('default_avatar')) e.currentTarget.src = '/assets/default_avatar.png'; }}
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
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 card-elevated rounded-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-border bg-muted/30">
                        <p className="text-sm font-semibold text-foreground truncate">
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
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <span>View Profile</span>
                        </Link>

                        <Link
                          href="/settings"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      {/* SWITCH ACCOUNTS SECTION */}
                      {storedAccounts.filter((acc: any) => acc.uid !== authUser.uid).length > 0 && (
                        <div className="border-t border-border py-2">
                          <p className="px-4 text-xs font-semibold text-muted-foreground uppercase mb-1">Switch Accounts</p>
                          {[...new Map(storedAccounts.map((acc: any) => [acc.uid, acc])).values()]
                            .filter((acc: any) => acc.uid !== authUser.uid)
                            .map((acc: any) => (
                              <div key={acc.uid} className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 group transition-colors cursor-pointer" onClick={() => handleSwitchAccount(acc)}>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full overflow-hidden relative border border-border">
                                    <img src={getAbsUrl(acc.photoURL)} className="object-cover w-6 h-6" onError={(e) => { if (!e.currentTarget.src.includes('default_avatar')) e.currentTarget.src = '/assets/default_avatar.png'; }} alt={acc.displayName || 'User'} />
                                  </div>
                                  <div className="max-w-[120px]">
                                    <p className="text-sm font-medium text-foreground truncate">{acc.displayName || 'User'}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveAccount(acc.uid);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                                  title="Remove account"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                        </div>
                      )}

                      <div className="border-t border-border py-1">
                        <button
                          onClick={handleAddAccount}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Account</span>
                        </button>
                      </div>

                      <div className="border-t border-border">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/5 transition-colors"
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
                className="px-4 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors border border-border rounded-xl hover:border-primary/50"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden btn-icon"
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
              className="sm:hidden border-t border-border py-4 space-y-2"
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

              <div className="px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full input-field pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

export default memo(Navbar);
