"use client";

import { useEffect, useState, useCallback } from "react";
import api from "../lib/api";
import PostItem from "../components/PostItem";
import { Post, User } from "../types";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert, Users, LayoutDashboard, Ban, ShieldCheck,
  CheckCircle2, Shield, Trash2, Settings, Power,
  MessageSquare, BookOpen, UserPlus, MailX, CheckSquare,
  Database, Activity, BarChart3, Bell, Lock, Globe,
  Cpu, Zap, Layers, RefreshCw, ExternalLink, MoreVertical,
  Search, Filter, Download
} from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { motion, AnimatePresence } from "framer-motion";
import TagInsights from "../components/TagInsights";

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const {
    maintenanceMode,
    broadcastMessage,
    readOnlyMode,
    pauseRegistrations,
    disableDms,
    requireVerifiedEmail,
    refreshSettings
  } = useSystem();

  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "content" | "settings" | "data">("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newBroadcastMsg, setNewBroadcastMsg] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const res = await api.get(`/admin/stats?user_id=${currentUser.uid}`);
        setStats(res.data);
      } else if (activeTab === "users") {
        const res = await api.get(`/admin/users?user_id=${currentUser.uid}`);
        setUsers(res.data.users);
      } else if (activeTab === "content") {
        const res = await api.get("/feed?flagged=true");
        setPosts(res.data);
      } else if (activeTab === "settings") {
        setNewBroadcastMsg(broadcastMessage);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUser, broadcastMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ACTIONS ---
  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    if (!currentUser || !confirm(`Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} this user?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/ban?admin_id=${currentUser.uid}`);
      setUsers(prev => prev.map(u => (u.uid === userId || u.id === userId) ? { ...u, is_banned: !currentBanStatus } : u));
    } catch {
      alert("Failed to toggle ban status");
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!currentUser || !confirm(`Change role to ${newRole}?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/role?new_role=${newRole}&admin_id=${currentUser.uid}`);
      setUsers(prev => prev.map(u => (u.uid === userId || u.id === userId) ? { ...u, role: newRole } : u));
    } catch {
      alert("Failed to update user role");
    }
  };

  const handleApprovePost = async (postId: string) => {
    if (!currentUser || !confirm("Approve this post and clear flags?")) return;
    try {
      await api.patch(`/admin/posts/${postId}/unflag?admin_id=${currentUser.uid}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch {
      alert("Failed to unflag post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser || !confirm("Delete this post permanently?")) return;
    try {
      await api.delete(`/posts/${postId}?user_id=${currentUser.uid}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch {
      alert("Failed to delete post");
    }
  };

  const handleToggleSetting = async (settingKey: string, currentValue: boolean) => {
    if (!currentUser || !confirm(`Turn ${currentValue ? 'OFF' : 'ON'} this setting?`)) return;
    setIsSavingSettings(true);
    try {
      await api.patch(`/admin/system/settings?admin_id=${currentUser.uid}`, { [settingKey]: !currentValue });
      await refreshSettings();
    } catch {
      alert("Failed to toggle setting");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUpdateBroadcast = async (clear: boolean = false) => {
    if (!currentUser) return;
    setIsSavingSettings(true);
    const msg = clear ? "" : newBroadcastMsg;
    try {
      await api.patch(`/admin/system/settings?admin_id=${currentUser.uid}`, { broadcast_message: msg });
      if (clear) setNewBroadcastMsg("");
      await refreshSettings();
    } catch (err) {
      console.error(err);
      alert("Failed to update broadcast message");
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (!currentUser) return null;

  return (
    <main className="min-h-screen pt-20 bg-background text-foreground selection:bg-primary/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-32">

        {/* TOP NAVIGATION / HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="p-3 bg-primary/20 rounded-2xl border border-primary/20 backdrop-blur-xl shadow-lg shadow-primary/10">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Admin <span className="text-primary">Command</span></h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border">
                  <Activity size={12} className="text-emerald-500 animate-pulse" /> Platform Live
                </span>
                <span className="text-xs text-muted-foreground font-medium">Build 2.4.0</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => window.location.reload()}
              className="p-2.5 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-all"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              <Lock size={18} /> Exit Admin
            </button>
          </motion.div>
        </header>

        {/* STATS OVERVIEW - GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <AnimatePresence>
            <StatCard
              key="stat-users"
              index={0}
              title="Total Ecosystem Users"
              value={stats?.total_users}
              icon={<Users className="w-6 h-6" />}
              trend="+12% this week"
              color="text-blue-500"
              glow="shadow-blue-500/20"
            />
            <StatCard
              key="stat-posts"
              index={1}
              title="Platform Content"
              value={stats?.total_posts}
              icon={<Layers className="w-6 h-6" />}
              trend="+4.2k new posts"
              color="text-emerald-500"
              glow="shadow-emerald-500/20"
            />
            <StatCard
              key="stat-moderation"
              index={2}
              title="Moderation Requests"
              value={stats?.flagged_posts}
              icon={<ShieldAlert className="w-6 h-6" />}
              trend="24 pending review"
              color="text-red-500"
              glow="shadow-red-500/20"
              isAlert={stats?.flagged_posts > 0}
            />
            <StatCard
              key="stat-incidents"
              index={3}
              title="Reported Incidents"
              value={stats?.total_reports}
              icon={<Ban className="w-6 h-6" />}
              trend="Check cases tab"
              color="text-amber-500"
              glow="shadow-amber-500/20"
            />
          </AnimatePresence>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex items-center gap-1 p-1 bg-muted/30 border border-border/50 rounded-2xl mb-8 overflow-x-auto hide-scrollbar">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Overview" },
            { id: "users", icon: Users, label: "Ecosystem" },
            { id: "content", icon: ShieldAlert, label: "Moderation Queue", count: posts.length },
            { id: "data", icon: Database, label: "Analytics" },
            { id: "settings", icon: Settings, label: "Control Center" }
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all relative ${activeTab === tab.id
                ? 'bg-card text-foreground shadow-xl shadow-black/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? "text-primary" : ""} />
              {tab.label}
              {tab.count > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-md min-w-[18px] text-center shadow-lg shadow-red-500/20">{tab.count}</span>}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary mx-6 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* TAB CONTENT AREA */}
        <section className="min-h-[600px] relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm rounded-3xl">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
              <p className="font-bold tracking-widest text-xs uppercase text-primary animate-pulse">Synchronizing Data</p>
            </div>
          )}

          <div className={`${loading ? 'opacity-20 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>

            {/* OVERVIEW TAB */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Quick Actions & Modules */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors" />
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                      <Cpu className="text-primary" /> Integrated Modules
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ModuleCard
                        title="Communities"
                        desc="Configure platform groups & moderation."
                        href="/admin/communities"
                        icon={<Globe className="text-blue-500" />}
                      />
                      <ModuleCard
                        title="Industry Hubs"
                        desc="Manage sector-specific knowledge hubs."
                        href="/admin/hubs"
                        icon={<Zap className="text-amber-500" />}
                      />
                      <ModuleCard
                        title="Moderation Portal"
                        desc="Detailed incident reports & tracking."
                        href="/admin/reports"
                        icon={<ShieldAlert className="text-red-500" />}
                      />
                      <ModuleCard
                        title="System Logs"
                        desc="Real-time backend performance metrics."
                        href="/admin/logs"
                        icon={<BarChart3 className="text-emerald-500" />}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border/50 rounded-[2rem] p-8">
                    <h2 className="text-2xl font-black mb-6">Recent Reports Queue</h2>
                    {posts.slice(0, 3).length > 0 ? (
                      <div className="space-y-4">
                        {posts.slice(0, 3).map((p, idx) => (
                          <div key={p.id || `report-${idx}`} className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                <ShieldAlert size={20} />
                              </div>
                              <p className="text-sm font-bold line-clamp-1">{p.content}</p>
                            </div>
                            <button onClick={() => setActiveTab("content")} className="text-xs font-black uppercase text-primary">Review</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl opacity-50">
                        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
                        <p className="font-bold">Queue is empty. Great work!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Quick Settings Side Panel */}
                <div className="space-y-6">
                  <div className={`p-6 rounded-[2rem] border transition-all ${maintenanceMode ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-xs">
                        {maintenanceMode ? <Lock className="text-red-500" size={14} /> : <Zap className="text-emerald-500" size={14} />}
                        Server Status
                      </h3>
                      <span className={`w-2 h-2 rounded-full animate-ping ${maintenanceMode ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    </div>
                    <p className="text-2xl font-black mb-1">{maintenanceMode ? 'MAINTENANCE' : 'OPERATIONAL'}</p>
                    <p className={`text-sm font-medium ${maintenanceMode ? 'text-red-500/80' : 'text-emerald-500/80'}`}>
                      {maintenanceMode ? 'Access limited to sys-admins' : 'All systems normal'}
                    </p>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="w-full mt-6 py-3 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl text-xs font-bold transition-all"
                    >
                      Update Platform State
                    </button>
                  </div>

                  <div className="bg-card border border-border/50 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                    <h3 className="text-lg font-black mb-4">Quick Broadcast</h3>
                    <textarea
                      value={newBroadcastMsg}
                      onChange={e => setNewBroadcastMsg(e.target.value)}
                      placeholder="Send alert to all users..."
                      className="w-full h-24 bg-muted/30 border border-border/50 rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                    <button
                      disabled={isSavingSettings || !newBroadcastMsg.trim()}
                      onClick={() => handleUpdateBroadcast()}
                      className="w-full mt-4 py-3 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      Fire Broadcast Card
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ECOSYSTEM / USERS TAB */}
            {activeTab === "users" && (
              <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="p-8 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-black">User Ecosystem</h2>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Found {users.length} active citizens</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 min-w-[240px]"
                      />
                    </div>
                    <button className="p-2 bg-muted/30 border border-border rounded-xl hover:bg-muted/50 transition-all">
                      <Filter size={18} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/10 border-b border-border text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">
                        <th className="px-8 py-5">Profile Entity</th>
                        <th className="px-8 py-5 hidden md:table-cell">Contact Identity</th>
                        <th className="px-8 py-5 text-center">Perm Level</th>
                        <th className="px-8 py-5 text-center">Live Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {users.length === 0 ? (
                        <tr><td colSpan={5} className="px-8 py-16 text-center text-muted-foreground font-medium italic">No ecosystem records found</td></tr>
                      ) : users.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).map((user, idx) => (
                        <tr key={user.uid || user.id || `user-${idx}`} className="hover:bg-primary/[0.02] transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-muted overflow-hidden border-2 border-border group-hover:border-primary/50 transition-colors">
                                <img src={user.photoURL || "/assets/default_avatar.png"} alt={user.username} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-black text-foreground">{user.display_name || user.username}</p>
                                <p className="text-xs text-muted-foreground font-medium lowercase">@{user.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 hidden md:table-cell text-sm font-medium text-foreground/70">{user.email || '—'}</td>
                          <td className="px-8 py-5 text-center">
                            <select
                              value={user.role || 'user'}
                              onChange={(e) => handleChangeRole((user.uid || user.id) ?? "", e.target.value)}
                              className="bg-muted/30 border border-border/50 rounded-xl px-3 py-1.5 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-muted/50 transition-all appearance-none text-center"
                            >
                              <option value="user">USER</option>
                              <option value="expert">EXPERT</option>
                              <option value="admin">ADMIN</option>
                            </select>
                          </td>
                          <td className="px-8 py-5 text-center uppercase tracking-tighter">
                            {user.is_banned ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 font-black rounded-lg bg-red-500/10 text-red-500 text-[10px]"><Ban size={10} /> REVOKED</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 font-black rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px]"><CheckCircle2 size={10} /> ACTIVE</span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleBan((user.uid || user.id) ?? "", user.is_banned || false)}
                                className={`p-2 rounded-xl transition-all ${user.is_banned ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                              >
                                {user.is_banned ? <ShieldCheck size={18} /> : <Ban size={18} />}
                              </button>
                              <button className="p-2 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-all">
                                <MoreVertical size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MODERATION QUEUE TAB */}
            {activeTab === "content" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                {posts.length === 0 ? (
                  <div className="lg:col-span-2 py-32 bg-card border border-border border-dashed rounded-[3rem] text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground">A Perfect Feed</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium">No posts are currently flagged. The community algorithm is working perfectly.</p>
                  </div>
                ) : (
                  posts.map((post, idx) => (
                    <motion.div
                      layout
                      key={post.id || `mod-${idx}`}
                      className="group relative rounded-[2.5rem] bg-card border border-border/50 overflow-hidden hover:border-red-500/30 transition-all shadow-2xl hover:shadow-red-500/5"
                    >
                      <div className="bg-red-500/10 text-red-500 border-b border-red-500/10 px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert size={16} className="animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Priority Escalation</span>
                        </div>
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-500/30">
                          {post.report_count || 1} Reports
                        </span>
                      </div>

                      <div className="p-8 pb-32 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                        <PostItem post={post} />
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-card/80 backdrop-blur-xl border-t border-border/50 flex gap-3">
                        <button
                          onClick={() => handleApprovePost(post.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-500 rounded-2xl text-xs font-black hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                        >
                          <CheckCircle2 size={16} /> VALID (Approve)
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-red-600/20 hover:scale-105 transition-all w-full"
                        >
                          <Trash2 size={16} /> REMOVE CONTENT
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* CONTROL CENTER / SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-2xl">
                  <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                    <Settings className="text-primary" /> Hardened Switches
                  </h2>

                  <div className="space-y-4">
                    <ToggleField
                      icon={<Power size={20} />}
                      title="Maintenance Mode"
                      desc="Locks out all non-admin users immediately."
                      active={maintenanceMode}
                      onToggle={() => handleToggleSetting('maintenance_mode', maintenanceMode)}
                      color="red"
                    />
                    <ToggleField
                      icon={<BookOpen size={20} />}
                      title="Read-Only Mode"
                      desc="Freezes all posting and interaction."
                      active={readOnlyMode}
                      onToggle={() => handleToggleSetting('read_only_mode', readOnlyMode)}
                      color="amber"
                    />
                    <ToggleField
                      icon={<UserPlus size={20} />}
                      title="Registration Gate"
                      desc="Pause new ecosystem intake."
                      active={pauseRegistrations}
                      onToggle={() => handleToggleSetting('pause_registrations', pauseRegistrations)}
                      color="orange"
                    />
                    <ToggleField
                      icon={<MailX size={20} />}
                      title="Global Message Switch"
                      desc="Disable private DMs."
                      active={disableDms}
                      onToggle={() => handleToggleSetting('disable_dms', disableDms)}
                      color="pink"
                    />
                    <ToggleField
                      icon={<CheckSquare size={20} />}
                      title="Validation Wall"
                      desc="Force email verification for interaction."
                      active={requireVerifiedEmail}
                      onToggle={() => handleToggleSetting('require_verified_email', requireVerifiedEmail)}
                      color="blue"
                    />
                  </div>
                </div>

                <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-2xl">
                  <h2 className="text-xl font-black mb-4">Urgent Broadcast System</h2>
                  <p className="text-sm text-muted-foreground mb-6 font-medium">Publish a persistent banner notification to every logged-in user.</p>
                  <textarea
                    value={newBroadcastMsg}
                    onChange={e => setNewBroadcastMsg(e.target.value)}
                    placeholder="e.g. Scheduled database maintenance in 10 minutes."
                    className="w-full h-32 bg-muted/20 border border-border/50 rounded-2xl p-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => handleUpdateBroadcast(true)}
                      className="flex-1 py-4 bg-muted border border-border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted/80 transition-all"
                    >
                      Clear Current Alert
                    </button>
                    <button
                      disabled={!newBroadcastMsg.trim() || isSavingSettings}
                      onClick={() => handleUpdateBroadcast()}
                      className="flex-1 py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-40"
                    >
                      Deploy Broadcast
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DATA INSIGHTS TAB */}
            {activeTab === "data" && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <TagInsights />
              </div>
            )}

          </div>
        </section>
      </div>
    </main>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, icon, trend, color, glow, index, isAlert }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-card border border-border/50 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group ${isAlert ? 'ring-2 ring-red-500/40' : ''}`}
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[60px] opacity-30 group-hover:opacity-50 transition-opacity bg-primary ${glow}`} />

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-muted/50 border border-border/50 transition-transform group-hover:scale-110 ${color}`}>
        {icon}
      </div>

      <div className="space-y-1">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">{title}</h3>
        <p className="text-4xl font-black tracking-tighter text-foreground">
          {value !== undefined ? value : <span className="text-2xl opacity-20">—</span>}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground`}>
          {trend}
        </span>
      </div>
    </motion.div>
  );
}

function ModuleCard({ title, desc, href, icon }: any) {
  return (
    <a href={href} className="flex items-center gap-5 p-5 bg-muted/20 border border-border/50 rounded-2xl hover:border-primary/40 hover:bg-muted/40 transition-all group no-underline">
      <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-black text-sm text-foreground mb-1 group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic">{desc}</p>
      </div>
      <ExternalLink size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

function ToggleField({ icon, title, desc, active, onToggle, color }: any) {
  const colors: any = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-600',
    pink: 'bg-pink-500',
    blue: 'bg-blue-500'
  }

  return (
    <div className="flex items-center justify-between p-6 bg-muted/10 border border-white/[0.03] rounded-2xl hover:bg-muted/20 transition-all">
      <div className="flex gap-5 items-center">
        <div className={`p-3 rounded-xl bg-card border border-border shadow-sm text-muted-foreground group-hover:text-primary transition-colors`}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground">{title}</h3>
          <p className="text-[11px] font-medium text-muted-foreground/80 mt-1">{desc}</p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none ${active ? colors[color] : 'bg-muted border border-border'}`}
      >
        <div className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition-all ${active ? 'translate-x-8' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
