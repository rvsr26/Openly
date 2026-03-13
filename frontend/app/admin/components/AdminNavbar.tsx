"use client";

import { Bell, Search, User, ChevronRight, Settings, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAbsUrl } from "@/app/lib/api";
import { usePathname } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function AdminNavbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Simple breadcrumb logic
  const paths = pathname.split('/').filter(x => x);
  
  return (
    <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-card/80">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm font-medium">
        {paths.map((path, index) => (
          <div key={path} className="flex items-center gap-2 capitalize">
            {index > 0 && <ChevronRight size={14} className="text-muted-foreground" />}
            <span className={index === paths.length - 1 ? "text-foreground font-black" : "text-muted-foreground hover:text-foreground transition-colors"}>
              {path.replace('-', ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="hidden md:flex relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Command Search..." 
            className="bg-muted/30 border border-border/50 rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
          />
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-card" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border/50" />

        {/* User Info */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-foreground">{user?.displayName || 'Admin User'}</p>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.1em]">Super User</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden border border-border shadow-sm">
            <img 
              src={getAbsUrl(user?.photoURL)} 
              alt="Admin" 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = "/assets/default_avatar.png" }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
