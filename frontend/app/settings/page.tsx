"use client";

import { Settings, User, Lock, LogOut, Shield, Activity, Save, AlertTriangle, Key, Trash2, Camera, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { profileApi } from "../lib/profileApi";
import { authApi } from "../lib/authApi";
import { uploadImage } from "../lib/api";

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("profile");
    const [isLoading, setIsLoading] = useState(false);

    // Profile Fields
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password Fields
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Activity Log
    const [activityLog, setActivityLog] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            loadProfile();
            if (activeTab === "account") loadActivity();
        }
    }, [user, activeTab]);

    const loadProfile = async () => {
        if (user) {
            try {
                const data = await profileApi.getProfile(user.uid);
                if (data && data.user_info) {
                    setDisplayName(data.user_info.display_name || user.displayName || "");
                    setBio(data.user_info.bio || "");
                    setPhotoURL(data.user_info.photoURL || user.photoURL || "");
                }
            } catch (e) {
                console.error("Failed to load profile", e);
                // Fallback to auth data
                setDisplayName(user.displayName || "");
                setPhotoURL(user.photoURL || "");
            }
        }
    };

    const loadActivity = async () => {
        try {
            const logs = await profileApi.getActivity();
            setActivityLog(logs);
        } catch (error) {
            console.error("Failed to load activity", error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await profileApi.updateProfile(user!.uid, {
                display_name: displayName,
                bio: bio,
                photoURL: photoURL
            });
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading("Uploading avatar...");
        try {
            const url = await uploadImage(file);
            setPhotoURL(url);
            toast.success("Avatar uploaded", { id: toastId });
        } catch (error) {
            toast.error("Upload failed", { id: toastId });
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        setIsLoading(true);
        try {
            await authApi.changePassword(oldPassword, newPassword);
            toast.success("Password changed successfully");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle2FA = async (enabled: boolean) => {
        try {
            await authApi.toggle2FA(enabled);
            toast.success(`Two-Factor Authentication ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            toast.error("Failed to update 2FA settings");
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) return;
        try {
            await profileApi.deleteAccount();
            router.push("/login");
            toast.success("Account deleted");
        } catch (error) {
            toast.error("Failed to delete account");
        }
    };

    const settingsTabs = [
        { id: "profile", label: "Edit Profile", icon: User },
        { id: "account", label: "Account & Activity", icon: Settings },
        { id: "privacy", label: "Privacy & Security", icon: Shield },
        { id: "reports", label: "Activity Reports", icon: Activity },
    ];

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 relative overflow-hidden">



            <main className="relative z-10 pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-10">

                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-72 flex-shrink-0">
                    <div className="sticky top-32 glass-premium p-4 space-y-2">
                        <div className="px-4 py-3 mb-2">
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Settings</h2>
                        </div>
                        {settingsTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group ${activeTab === tab.id
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                                    }`}
                            >
                                <tab.icon size={20} className={activeTab === tab.id ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div layoutId="active-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="space-y-6"
                        >
                            {/* --- PROFILE TAB --- */}
                            {activeTab === "profile" && (
                                <div className="glass-card p-8 md:p-10 space-y-10 relative overflow-hidden">
                                    {/* Decorative top gradient */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary/0" />

                                    <div>
                                        <h2 className="text-3xl font-bold tracking-tight mb-2">Public Profile</h2>
                                        <p className="text-muted-foreground">Manage how you appear to the community.</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-border/40">
                                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-2xl ring-2 ring-border/50 group-hover:ring-primary/50 transition-all">
                                                <img src={photoURL || "/assets/default_avatar.png"} alt="Avatar" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-full backdrop-blur-sm">
                                                <Camera size={32} className="text-white drop-shadow-md" />
                                            </div>
                                            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                                        </div>
                                        <div className="text-center sm:text-left space-y-2">
                                            <h3 className="font-bold text-xl">{user.email}</h3>
                                            <div className="flex items-center gap-2 justify-center sm:justify-start text-sm text-muted-foreground">
                                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                Online Status: Visible
                                            </div>
                                            <button onClick={() => fileInputRef.current?.click()} className="text-primary text-sm font-medium hover:underline">
                                                Change Profile Photo
                                            </button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-2xl">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">Display Name</label>
                                                <input
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    className="input-field"
                                                    placeholder="e.g. Alex Doe"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">Bio</label>
                                                <textarea
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                    className="input-field min-h-[150px] resize-y"
                                                    placeholder="Share a bit about yourself..."
                                                />
                                                <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end pt-4">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="btn-primary w-full sm:w-auto min-w-[150px] flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? "Saving..." : <><Save size={18} /> Save Changes</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* --- ACCOUNT TAB --- */}
                            {activeTab === "account" && (
                                <div className="space-y-8">
                                    {/* Activity Log */}
                                    <div className="glass-card p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold">Recent Activity</h2>
                                                <p className="text-muted-foreground text-sm">Your latest actions and security events.</p>
                                            </div>
                                            <button className="text-primary text-sm font-medium hover:underline">View All</button>
                                        </div>

                                        <div className="space-y-1">
                                            {activityLog.length === 0 ? (
                                                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-border/50">
                                                    <Activity size={40} className="mx-auto mb-3 opacity-20" />
                                                    <p>No recent activity recorded.</p>
                                                </div>
                                            ) : (
                                                activityLog.map((log, i) => (
                                                    <div key={i} className="group flex items-center justify-between p-4 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/50">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                                <Activity size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm">{log.action}</p>
                                                                <p className="text-xs text-muted-foreground">{log.details}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                                                            {new Date(log.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="glass-card p-8 border-l-4 border-l-destructive/50 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <AlertTriangle size={120} />
                                        </div>

                                        <h2 className="text-2xl font-bold text-destructive flex items-center gap-2 mb-6">
                                            Danger Zone
                                        </h2>

                                        <div className="grid gap-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                                                <div>
                                                    <h3 className="font-bold">Deactivate Account</h3>
                                                    <p className="text-sm text-muted-foreground">Hide your profile and content temporarily.</p>
                                                </div>
                                                <button onClick={() => profileApi.deactivateAccount().then(() => toast.success("Deactivated (Simulated)"))} className="px-5 py-2.5 bg-background border border-destructive/20 text-destructive rounded-xl hover:bg-destructive hover:text-white transition-all text-sm font-medium whitespace-nowrap">
                                                    Deactivate User
                                                </button>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                                                <div>
                                                    <h3 className="font-bold">Delete Account</h3>
                                                    <p className="text-sm text-muted-foreground">Permanently remove all data. This cannot be undone.</p>
                                                </div>
                                                <button onClick={handleDeleteAccount} className="px-5 py-2.5 bg-destructive text-white rounded-xl hover:bg-destructive/90 shadow-lg shadow-destructive/20 transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap">
                                                    <Trash2 size={16} /> Delete Account
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- PRIVACY TAB --- */}
                            {activeTab === "privacy" && (
                                <div className="glass-card p-8 md:p-10 space-y-10">
                                    {/* Change Password */}
                                    <section>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                                                <Key size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold">Password</h2>
                                                <p className="text-muted-foreground text-sm">Update your password security.</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleChangePassword} className="max-w-xl space-y-5 bg-muted/10 p-6 rounded-2xl border border-border/50">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">Current Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={oldPassword}
                                                        onChange={(e) => setOldPassword(e.target.value)}
                                                        className="input-field pr-10"
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold ml-1">New Password</label>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="input-field"
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold ml-1">Confirm Password</label>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="input-field"
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />} {showPassword ? "Hide" : "Show"} Passwords
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="btn-primary"
                                                >
                                                    Update Password
                                                </button>
                                            </div>
                                        </form>
                                    </section>

                                    <div className="h-px bg-border/50" />

                                    {/* 2FA */}
                                    <section>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                                                <Shield size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
                                                <p className="text-muted-foreground text-sm">Add an extra layer of security.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl">
                                            <div className="max-w-md">
                                                <h3 className="font-bold text-lg mb-1">Secure your account</h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    When enabled, you'll need to verify your identity via email or an authenticator app when logging on a new device.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer ml-4">
                                                <input type="checkbox" className="sr-only peer" onChange={(e) => handleToggle2FA(e.target.checked)} />
                                                <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-500 shadow-inner"></div>
                                            </label>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* --- REPORTS TAB --- */}
                            {activeTab === "reports" && (
                                <div className="glass-card relative overflow-hidden text-center py-24 px-6 md:px-12">
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                                    <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto space-y-8">
                                        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary rotate-12 shadow-xl shadow-primary/10 mb-4">
                                            <Activity size={48} />
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-4xl font-extrabold tracking-tight">Activity Reports</h3>
                                            <p className="text-xl text-muted-foreground leading-relaxed">
                                                Dive deep into your analytics. Track your time, engagement, and content performance with detailed insights.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => router.push("/reports")}
                                            className="btn-primary text-lg px-10 py-4 flex items-center gap-3"
                                        >
                                            View Full Dashboard <ChevronRight size={20} />
                                        </button>

                                        <p className="text-sm text-muted-foreground/60">
                                            Updated automatically every 60 seconds while active.
                                        </p>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

// Icon for chevron (missing in imports)
import { ChevronRight } from "lucide-react";
