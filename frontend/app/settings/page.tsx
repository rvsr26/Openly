"use client";

import Navbar from "../components/Navbar";
import { Settings, Save, User, FileText, Lock, LogOut, Bell, Shield, Smartphone, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { auth } from "../firebase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile"); // profile, account, notifications, security

    // Form States
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setCurrentUser(user);
                fetchProfile(user.uid);
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchProfile = async (uid: string) => {
        setIsLoading(true);
        try {
            const res = await api.get(`/users/${uid}/profile`);
            if (res.data && res.data.user_info) {
                setDisplayName(res.data.user_info.display_name || "");
                setBio(res.data.user_info.bio || "");
                setPhotoURL(res.data.user_info.photoURL || "");
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
            toast.error("Failed to load profile data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setIsSaving(true);
        try {
            await api.put(`/users/${currentUser.uid}`, {
                display_name: displayName,
                bio: bio,
                photoURL: photoURL
            });
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile", error);
            toast.error("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Optimistic update (optional) or loading state
        const loadingToast = toast.loading("Uploading avatar...");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.url) {
                setPhotoURL(res.data.url);
                toast.success("Avatar uploaded!", { id: loadingToast });
            }
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload avatar.", { id: loadingToast });
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleLogout = async () => {
        if (confirm("Are you sure you want to log out?")) {
            try {
                await auth.signOut();
                router.push("/login");
            } catch (error) {
                console.error("Logout failed", error);
                toast.error("Logout failed");
            }
        }
    };

    const settingsTabs = [
        { id: "profile", label: "Edit Profile", icon: User },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "security", label: "Privacy & Security", icon: Shield },
        { id: "account", label: "Account Actions", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />

            <main className="pt-28 max-w-6xl mx-auto px-4 md:px-8">
                {/* Header Section */}
                <div className="mb-10">
                    <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent inline-block">
                        Settings
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg">
                        Manage your profile, preferences, and account security.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                        {settingsTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 font-bold text-sm ${activeTab === tab.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <tab.icon size={18} />
                                    <span>{tab.label}</span>
                                </div>
                                {activeTab === tab.id && <ChevronRight size={16} />}
                            </button>
                        ))}

                        <div className="pt-6 mt-6 border-t border-white/5">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-bold text-sm"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === "profile" && (
                                    <div className="glass-card p-6 md:p-10 space-y-8">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div
                                                onClick={handleAvatarClick}
                                                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-xl cursor-pointer hover:opacity-80 transition-opacity relative overflow-hidden group"
                                            >
                                                {photoURL ? (
                                                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                                                ) : displayName ? displayName[0] : <User />}

                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] uppercase font-bold text-white">Edit</span>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            <div>
                                                <h2 className="text-2xl font-bold">Profile Details</h2>
                                                <p className="text-muted-foreground text-sm">Update your public profile information.</p>
                                            </div>
                                        </div>

                                        {isLoading ? (
                                            <div className="animate-pulse space-y-4">
                                                <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                                                <div className="h-32 bg-white/5 rounded-xl w-full"></div>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSave} className="space-y-6">
                                                <div className="grid gap-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Display Name</label>
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                        <input
                                                            type="text"
                                                            value={displayName}
                                                            onChange={(e) => setDisplayName(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                                            placeholder="Your Name"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid gap-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bio</label>
                                                    <div className="relative">
                                                        <FileText className="absolute left-4 top-4 text-muted-foreground" size={18} />
                                                        <textarea
                                                            value={bio}
                                                            onChange={(e) => setBio(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 h-32 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium resize-none leading-relaxed"
                                                            placeholder="Tell the community about yourself..."
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground text-right">{bio.length}/160 characters</p>
                                                </div>

                                                <div className="flex justify-end pt-4">
                                                    <button
                                                        type="submit"
                                                        disabled={isSaving}
                                                        className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        {isSaving ? <span className="animate-spin">⏳</span> : <Save size={18} />}
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {activeTab === "notifications" && (
                                    <div className="glass-card p-6 md:p-10 text-center py-20">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                                            <Bell size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Notifications Coming Soon</h3>
                                        <p className="text-muted-foreground max-w-md mx-auto">
                                            We're working on giving you granular control over your push and email notifications. Stay tuned!
                                        </p>
                                    </div>
                                )}

                                {activeTab === "security" && (
                                    <div className="glass-card p-6 md:p-10 text-center py-20">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                                            <Shield size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Privacy & Security</h3>
                                        <p className="text-muted-foreground max-w-md mx-auto">
                                            Advanced security features like 2FA and session management are currently in development.
                                        </p>
                                    </div>
                                )}

                                {activeTab === "account" && (
                                    <div className="glass-card p-6 md:p-10 space-y-8">
                                        <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2">
                                            <Lock size={24} />
                                            Danger Zone
                                        </h2>

                                        <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
                                            <h3 className="font-bold text-lg mb-2">Delete Account</h3>
                                            <p className="text-muted-foreground text-sm mb-6">
                                                Permanently delete your account and all of your content. This action cannot be undone.
                                            </p>
                                            <button className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-2.5 rounded-xl font-bold transition-all text-sm border border-red-500/20 hover:border-red-500">
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
