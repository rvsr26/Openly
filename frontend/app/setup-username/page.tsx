"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import axios from "axios";
import api from "../lib/api";

import { onAuthStateChanged, User } from "firebase/auth";

const USERNAME_REGEX = /^[a-z0-9_]{3,15}$/;

export default function SetupUsername() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);

  /* ---------------- AUTH + EXISTING USERNAME CHECK ---------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);

      try {
        const res = await api.get(
          `/users/${u.uid}/profile`
        );

        if (res.data?.user_info?.username) {
          router.push("/profile");
          return;
        }
      } catch (err) {
        console.error("Profile check failed", err);
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  /* ---------------- CHECK AVAILABILITY (DEBOUNCED) ---------------- */
  useEffect(() => {
    if (!USERNAME_REGEX.test(username)) {
      setAvailable(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await api.get(
          `/users/username/${username}`
        );

        // If user exists → taken
        if (res.data) setAvailable(false);
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setAvailable(true); // username free
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [username]);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    if (!user || loading) return;
    setError("");

    if (!USERNAME_REGEX.test(username)) {
      setError(
        "Username must be 3–15 characters (lowercase letters, numbers, _)"
      );
      return;
    }

    if (available === false) {
      setError("Username is already taken");
      return;
    }

    setLoading(true);

    try {
      await api.post("/users/set-username", {
        user_id: user.uid,
        username,
      });

      router.push("/profile");
    } catch (err: unknown) {
      console.error("Username error:", err);

      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (axios.isAxiosError(err) && err.request) {
        setError("Cannot connect to server. Is backend running?");
      } else {
        setError("Unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOADING STATE ---------------- */
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking account…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-md border border-border">
        <div className="flex justify-center mb-6">
          <img src="/assets/logo.png" alt="Openly" className="h-12 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-foreground text-center">
          Choose your username
        </h1>

        <p className="text-secondary-foreground/60 mb-8 text-center text-sm">
          This will be your public identity on Open Space
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

        <input
          value={username}
          onChange={(e) =>
            setUsername(e.target.value.toLowerCase().trim())
          }
          placeholder="e.g. reviewer_pro"
          className={`w-full border p-3 rounded-lg mb-2 focus:outline-none ${available === false
            ? "border-red-500"
            : available === true
              ? "border-green-500"
              : "border-gray-300"
            }`}
        />

        {/* STATUS TEXT */}
        {available === true && (
          <p className="text-xs text-green-600 mb-2">
            ✓ Username available
          </p>
        )}
        {available === false && (
          <p className="text-xs text-red-600 mb-2">
            ✗ Username already taken
          </p>
        )}

        <p className="text-xs text-gray-500 mb-4">
          3–15 characters • lowercase • letters, numbers, underscore
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading || available === false || !username}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? "Saving..." : "Set Username"}
        </button>
      </div>
    </div>
  );
}
