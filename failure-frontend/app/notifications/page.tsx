"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/users/${user.uid}/notifications`
        );
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading notifications...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <Navbar />

      <main className="pt-24 max-w-3xl mx-auto px-4 pb-10">
        <h1 className="text-2xl font-bold mb-6">🔔 Notifications</h1>

        {notifications.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-300 p-6 text-center text-gray-500">
            You’re all caught up 🎉
          </div>
        )}

        <div className="space-y-4">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.post_id ? `/post/${n.post_id}` : "#"}
              className={`block bg-white border rounded-lg p-4 hover:bg-gray-50 transition ${
                !n.read ? "border-blue-500" : "border-gray-300"
              }`}
            >
              <p className="text-sm text-gray-800">{n.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
