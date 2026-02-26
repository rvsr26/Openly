"use client";

import { useEffect, useState } from "react";
import api from "../lib/api";
import PostItem from "../components/PostItem";
import { Post, User } from "../types";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Users, LayoutDashboard, Ban, ShieldCheck, CheckCircle2, Shield, Trash2, Settings, Power, MessageSquare, BookOpen, UserPlus, MailX, CheckSquare, Database } from "lucide-react";
import { useSystem } from "@/context/SystemContext";
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

  // Tabs Fetching
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    if (activeTab === "dashboard") {
      api.get(`/admin/stats?user_id=${currentUser.uid}`)
        .then(res => setStats(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));

    } else if (activeTab === "users") {
      api.get(`/admin/users?user_id=${currentUser.uid}`)
        .then(res => setUsers(res.data.users))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));

    } else if (activeTab === "content") {
      api.get("/feed?flagged=true")
        .then(res => setPosts(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else if (activeTab === "settings") {
      setNewBroadcastMsg(broadcastMessage);
      setLoading(false);
    }
  }, [activeTab, currentUser, broadcastMessage]);


  // Actions
  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    if (!currentUser || !confirm(`Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} this user?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/ban?admin_id=${currentUser.uid}`);
      setUsers(users.map(u => (u.uid === userId || u.id === userId) ? { ...u, is_banned: !currentBanStatus } : u));
    } catch {
      alert("Failed to toggle ban status");
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!currentUser || !confirm(`Change role to ${newRole}?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/role?new_role=${newRole}&admin_id=${currentUser.uid}`);
      setUsers(users.map(u => (u.uid === userId || u.id === userId) ? { ...u, role: newRole } : u));
    } catch {
      alert("Failed to update user role");
    }
  };

  const handleApprovePost = async (postId: string) => {
    if (!currentUser || !confirm("Approve this post and clear flags?")) return;
    try {
      await api.patch(`/admin/posts/${postId}/unflag?admin_id=${currentUser.uid}`);
      setPosts(posts.filter(p => p.id !== postId));
    } catch {
      alert("Failed to unflag post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser || !confirm("Delete this post permanently?")) return;
    try {
      await api.delete(`/posts/${postId}?user_id=${currentUser.uid}`);
      setPosts(posts.filter(p => p.id !== postId));
    } catch {
      alert("Failed to delete post");
    }
    const handleToggleMaintenance = async () => {
      if (!currentUser || !confirm(`Turn ${maintenanceMode ? 'OFF' : 'ON'} maintenance mode for all users?`)) return;
      setIsSavingSettings(true);
      try {
        await api.patch(`/admin/system/settings?admin_id=${currentUser.uid}`, { maintenance_mode: !maintenanceMode });
        await refreshSettings();
      } catch {
        alert("Failed to toggle maintenance mode");
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
      } catch {
        alert("Failed to update broadcast message");
      } finally {
        setIsSavingSettings(false);
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


    if (!currentUser) return null;

    return (
      <main className="pt-24 max-w-6xl mx-auto px-4 pb-20">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground flex items-center gap-3">
              <Shield className="w-10 h-10 text-primary" />
              Admin Command Center
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">Manage platform health, moderate content, and oversee user activity.</p>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="flex space-x-2 bg-card border border-border/50 p-2 rounded-2xl mb-8 overflow-x-auto overflow-y-hidden hide-scrollbar">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Users size={18} />
            User Management
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <ShieldAlert size={18} />
            Content Queue {posts.length > 0 && activeTab !== 'content' && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{posts.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Database size={18} />
            Data Insights
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Settings size={18} />
            System Settings
          </button>
        </div>

        {/* Main Content Area */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
              <p className="font-bold tracking-widest text-xs uppercase">Loading data...</p>
            </div>
          ) : (
            <>
              {/* DASHBOARD TAB */}
              {activeTab === "dashboard" && stats && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <StatCard title="Total Users" icon={<Users className="w-6 h-6" />} value={stats.total_users} color="text-blue-500" bg="bg-blue-500/10" />
                    <StatCard title="Total Posts" icon={<LayoutDashboard className="w-6 h-6" />} value={stats.total_posts} color="text-emerald-500" bg="bg-emerald-500/10" />
                    <StatCard title="Flagged Posts" icon={<ShieldAlert className="w-6 h-6" />} value={stats.flagged_posts} color="text-red-500" bg="bg-red-500/10" />
                    <StatCard title="User Reports" icon={<Ban className="w-6 h-6" />} value={stats.total_reports} color="text-amber-500" bg="bg-amber-500/10" />
                  </div>
                  <div className="mt-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <h2 className="text-xl font-bold mb-4 text-foreground">Advanced Management Modules</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <a href="/admin/communities" className="p-6 bg-card border border-border/50 rounded-2xl hover:border-primary transition-colors block">
                        <h3 className="text-lg font-bold text-primary mb-2">Community Management</h3>
                        <p className="text-sm text-muted-foreground">Advanced CRUD operations for platform communities.</p>
                      </a>
                      <a href="/admin/hubs" className="p-6 bg-card border border-border/50 rounded-2xl hover:border-primary transition-colors block">
                        <h3 className="text-lg font-bold text-primary mb-2">Industry Hubs</h3>
                        <p className="text-sm text-muted-foreground">Manage and configure top-level industry hubs.</p>
                      </a>
                      <a href="/admin/reports" className="p-6 bg-card border border-border/50 rounded-2xl hover:border-primary transition-colors block">
                        <h3 className="text-lg font-bold text-primary mb-2">Reported Content Cases</h3>
                        <p className="text-sm text-muted-foreground">Track and resolve moderation incidents manually.</p>
                      </a>
                    </div>
                  </div>
                </>
              )}

              {/* USERS TAB */}
              {activeTab === "users" && (
                <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-500">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-6 py-5 font-black">User</th>
                          <th className="px-6 py-5 font-black hidden sm:table-cell">Email</th>
                          <th className="px-6 py-5 font-black text-center">Role</th>
                          <th className="px-6 py-5 font-black text-center">Status</th>
                          <th className="px-6 py-5 font-black text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {users.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No users found</td></tr>
                        ) : users.map(user => (
                          <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                  <img src={user.photoURL || "/assets/default_avatar.png"} alt={user.username} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="font-bold text-foreground">{user.display_name || user.username}</p>
                                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden sm:table-cell text-sm text-foreground/80">{user.email || '—'}</td>
                            <td className="px-6 py-4 text-center">
                              <select
                                value={user.role || 'user'}
                                onChange={(e) => handleChangeRole((user.uid || user.id) ?? "", e.target.value)}
                                className="bg-background border border-border/50 rounded-lg px-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary/50"
                              >
                                <option value="user">User</option>
                                <option value="expert">Expert</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {user.is_banned ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 text-xs font-bold"><Ban size={12} /> Banned</span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-bold"><CheckCircle2 size={12} /> Active</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleToggleBan((user.uid || user.id) ?? "", user.is_banned || false)}
                                className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${user.is_banned ? 'bg-white/10 text-foreground hover:bg-white/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                              >
                                {user.is_banned ? 'Unban' : 'Ban'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CONTENT MODERATION TAB */}
              {activeTab === "content" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                  {posts.length === 0 ? (
                    <div className="bg-card border border-border/50 border-dashed rounded-3xl p-12 text-center">
                      <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-foreground">All clear!</h3>
                      <p className="text-muted-foreground mt-2">No posts require moderation right now.</p>
                    </div>
                  ) : (
                    posts.map(post => (
                      <div key={post.id} className="relative rounded-2xl overflow-hidden border-2 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                        {/* Flag Banner */}
                        <div className="bg-red-500/10 text-red-500 border-b border-red-500/20 px-6 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldAlert size={16} />
                            <span className="text-sm font-black uppercase tracking-wider">Flagged for Moderation</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                              {post.report_count || 1} Reports
                            </span>
                          </div>
                        </div>

                        <div className="pointer-events-none p-6 bg-card">
                          <PostItem post={post} />
                        </div>

                        {/* Admin Actions Sticky Bar */}
                        <div className="bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 flex justify-end gap-3 z-10 bottom-0 relative">
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white/10 text-foreground rounded-xl text-xs font-bold hover:bg-white/20 transition-all border border-border"
                          >
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            Approve Post (Unflag)
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
                          >
                            <Trash2 size={16} />
                            Delete Post
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {/* SYSTEM SETTINGS TAB */}
              {activeTab === "settings" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-2xl">

                  {/* Maintenance Mode Toggle */}
                  <div className="bg-card border border-border/50 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex gap-4 items-center">
                      <div className={`p-3 rounded-xl ${maintenanceMode ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        <Power size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Maintenance Mode</h3>
                        <p className="text-sm text-muted-foreground">Lock out non-admin users from accessing the platform.</p>
                      </div>
                    </div>

                    <button
                      disabled={isSavingSettings}
                      onClick={() => handleToggleSetting('maintenance_mode', maintenanceMode)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${maintenanceMode ? 'bg-red-500' : 'bg-border'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Read-Only Mode Toggle */}
                  <div className="bg-card border border-border/50 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex gap-4 items-center">
                      <div className={`p-3 rounded-xl ${readOnlyMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-foreground/10 text-foreground'}`}>
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Read-Only Mode</h3>
                        <p className="text-sm text-muted-foreground">Disable new posts and comments across the platform.</p>
                      </div>
                    </div>

                    <button
                      disabled={isSavingSettings}
                      onClick={() => handleToggleSetting('read_only_mode', readOnlyMode)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${readOnlyMode ? 'bg-yellow-500' : 'bg-border'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${readOnlyMode ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Pause Registrations Toggle */}
                  <div className="bg-card border border-border/50 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex gap-4 items-center">
                      <div className={`p-3 rounded-xl ${pauseRegistrations ? 'bg-orange-500/10 text-orange-500' : 'bg-foreground/10 text-foreground'}`}>
                        <UserPlus size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Pause Registrations</h3>
                        <p className="text-sm text-muted-foreground">Stop new users from signing up (OAuth & Email).</p>
                      </div>
                    </div>

                    <button
                      disabled={isSavingSettings}
                      onClick={() => handleToggleSetting('pause_registrations', pauseRegistrations)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${pauseRegistrations ? 'bg-orange-500' : 'bg-border'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${pauseRegistrations ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Disable DMs Toggle */}
                  <div className="bg-card border border-border/50 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex gap-4 items-center">
                      <div className={`p-3 rounded-xl ${disableDms ? 'bg-pink-500/10 text-pink-500' : 'bg-foreground/10 text-foreground'}`}>
                        <MailX size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Global DM Kill Switch</h3>
                        <p className="text-sm text-muted-foreground">Lock direct messaging for all non-admin users.</p>
                      </div>
                    </div>

                    <button
                      disabled={isSavingSettings}
                      onClick={() => handleToggleSetting('disable_dms', disableDms)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${disableDms ? 'bg-pink-500' : 'bg-border'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${disableDms ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Require Verified Email Toggle */}
                  <div className="bg-card border border-border/50 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex gap-4 items-center">
                      <div className={`p-3 rounded-xl ${requireVerifiedEmail ? 'bg-indigo-500/10 text-indigo-500' : 'bg-foreground/10 text-foreground'}`}>
                        <CheckSquare size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Require Verified Email</h3>
                        <p className="text-sm text-muted-foreground">Only allow verified accounts to post and comment.</p>
                      </div>
                    </div>

                    <button
                      disabled={isSavingSettings}
                      onClick={() => handleToggleSetting('require_verified_email', requireVerifiedEmail)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${requireVerifiedEmail ? 'bg-indigo-500' : 'bg-border'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${requireVerifiedEmail ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Broadcast Message */}
                  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                    <div className="flex gap-4 items-center mb-6">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Global Broadcast Banner</h3>
                        <p className="text-sm text-muted-foreground">Display an urgent message to all users across the platform.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <textarea
                        value={newBroadcastMsg}
                        onChange={(e) => setNewBroadcastMsg(e.target.value)}
                        placeholder="Enter broadcast message here... (e.g., Scheduled downtime in 1 hour)"
                        className="w-full bg-background border border-border/50 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/50 resize-none h-24"
                      />
                      <div className="flex gap-3 justify-end">
                        <button
                          disabled={isSavingSettings || !broadcastMessage}
                          onClick={() => handleUpdateBroadcast(true)}
                          className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-foreground transition-colors disabled:opacity-50"
                        >
                          Clear Banner
                        </button>
                        <button
                          disabled={isSavingSettings || !newBroadcastMsg.trim() || newBroadcastMsg === broadcastMessage}
                          onClick={() => handleUpdateBroadcast(false)}
                          className="px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          Publish Broadcast
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* DATA INSIGHTS TAB */}
              {activeTab === "data" && (
                <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                  <TagInsights />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    );
  }
}

function StatCard({ title, value, icon, bg, color }: any) {
  return (
    <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity ${bg}`} />
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${bg} ${color}`}>
        {icon}
      </div>
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{title}</h3>
      <p className="text-4xl font-black text-foreground mt-2">{value !== undefined ? value : '—'}</p>
    </div>
  )
}
