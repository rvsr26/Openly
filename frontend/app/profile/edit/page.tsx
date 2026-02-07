"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import api, { getAbsUrl } from "../../lib/api";

import Navbar from "../../components/Navbar";
import { auth } from "../../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const res = await api.get(`/users/${u.uid}/profile`);
          const info = res.data.user_info || {};
          setHeadline(info.headline || "");
          setBio(info.bio || "");
          setWebsite(info.website || "");
          setLocation(info.location || "");
          setPhotoURL(info.photoURL || u.photoURL || "");
        } catch (e) {
          console.error("Failed to load profile for edit", e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await api.post(
        `/users/profile/photo?user_id=${user.uid}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setPhotoURL(res.data.photoURL);
      // Invalidate cache so Navbar and other components update immediately
      queryClient.invalidateQueries({ queryKey: ["userProfile", user.uid] });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await api.post("/users/profile/update", {
        user_id: user.uid,
        headline,
        bio,
        website,
        location
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile", user.uid] });
      router.push("/profile");
    } catch (e) {
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return <div className="p-10 text-center">Please login to edit your profile.</div>;

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <Navbar />

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/profile" className="flex items-center text-muted-foreground hover:text-foreground transition mb-2">
            <ArrowLeft size={18} className="mr-1" /> Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
        </div>

        <div className="glass-card rounded-xl p-8 border border-border space-y-8">

          {/* Photo Upload Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl overflow-hidden bg-secondary border-2 border-border shadow-lg">
                <img
                  src={getAbsUrl(photoURL)}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl text-white"
              >
                {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
              </button>
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
              >
                {isUploading ? "Uploading..." : "Change Profile Photo"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Headline */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Headline</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="Ex-Founder, Learning Rust, Freelancer..."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2 px-1">Appears below your name in your profile</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">About</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition h-32 resize-none"
                placeholder="Tell your story..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Location</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Website</label>
              <input
                type="url"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="https://yourwebsite.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:brightness-110 shadow-lg shadow-primary/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
            >
              {isSaving ? "Saving..." : <><Save size={20} /> Save Changes</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
