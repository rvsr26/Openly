"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, ShieldAlert, Globe, Zap, 
  Settings, Database, BarChart3, ChevronLeft, Shield,
  LogOut, Home
} from "lucide-react";
import { motion } from "framer-motion";

const sidebarLinks = [
  { id: "dashboard", href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { id: "users", href: "/admin?tab=users", icon: Users, label: "Ecosystem" },
  { id: "moderation", href: "/admin/reports", icon: ShieldAlert, label: "Moderation" },
  { id: "communities", href: "/admin/communities", icon: Globe, label: "Communities" },
  { id: "hubs", href: "/admin/hubs", icon: Zap, label: "Industry Hubs" },
  { id: "analytics", href: "/admin?tab=data", icon: Database, label: "Analytics" },
  { id: "settings", href: "/admin?tab=settings", icon: Settings, label: "Command Center" },
];

export default function AdminSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="fixed left-0 top-0 bottom-0 bg-card border-r border-border z-50 flex flex-col transition-all duration-300"
    >
      {/* Sidebar Header */}
      <div className="h-20 flex items-center px-6 border-b border-border gap-3 overflow-hidden">
        <div className="w-9 h-9 min-w-[36px] rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            <span className="text-sm font-black tracking-tighter text-foreground">OPNS-PROTOCOL</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Sys-Admin</span>
          </motion.div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto hide-scrollbar">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.id}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
                isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon size={20} className={isActive ? "text-primary" : "group-hover:scale-110 transition-transform"} />
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-bold"
                >
                  {link.label}
                </motion.span>
              )}
              {isActive && !isCollapsed && (
                <motion.div
                  layoutId="activeSideTab"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          href="/feed"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all group"
        >
          <Home size={20} className="group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span className="text-sm font-bold">Return Home</span>}
        </Link>
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all group"
        >
          <ChevronLeft 
            size={20} 
            className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} 
          />
          {!isCollapsed && <span className="text-sm font-bold">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
