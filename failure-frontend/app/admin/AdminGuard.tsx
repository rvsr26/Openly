"use client";

import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/";
        return;
      }

      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/users/${user.uid}/profile`
        );

        // 🔴 TEMP ADMIN CHECK
        // Later: use role field (admin/mod)
        if (res.data?.user_info?.username === "admin") {
          setAllowed(true);
        } else {
          window.location.href = "/";
        }
      } catch {
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking admin access...
      </div>
    );

  return allowed ? <>{children}</> : null;
}
