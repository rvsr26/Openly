"use client";

import { useState } from "react";
import AdminGuard from "./AdminGuard";
import AdminSidebar from "./components/AdminSidebar";
import AdminNavbar from "./components/AdminNavbar";
import { motion } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <AdminSidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />

        {/* Main Content Area */}
        <motion.div 
          initial={false}
          animate={{ paddingLeft: isSidebarCollapsed ? 80 : 280 }}
          className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        >
          <AdminNavbar />
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </motion.div>
      </div>
    </AdminGuard>
  );
}
