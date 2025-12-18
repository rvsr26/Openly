"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import axios from "axios";
import Navbar from "../../components/Navbar";

export default function EditProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/users/${user.uid}/profile`
        );

        setDisplayName(
          res.data?.user_info?.display_name || user.displayName || ""
        );
        setBio(res.data?.user_info?.bio || "");
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!user) return;
    setError("");

    if (displayName.trim().length < 3) {
      setError("Display name must be at least 3 characters");
      return;
    }

    setSaving(true);

    try {
      await axios.post("http://127.0.0.1:8000/users/update-profile", {
        user_id: user.uid,
        display_name: displayName.trim(),
        bio: bio.trim(),
      });

      router.push("/profile");
    } catch (err: any) {
      console.error("Update profile error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />

      <main className="pt-24 max-w-xl mx-auto px-4">
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">✏️ Edit Profile</h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {/* DISPLAY NAME */}
          <label className="block mb-4">
            <span className="block text-sm font-semibold mb-1">
              Display Name
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border p-3 rounded"
              placeholder="Your name"
            />
          </label>

          {/* BIO */}
          <label className="block mb-6">
            <span className="block text-sm font-semibold mb-1">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full border p-3 rounded resize-none"
              placeholder="A short bio about you"
            />
          </label>

          {/* ACTIONS */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 p-3 rounded font-semibold"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
