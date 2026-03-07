"use client";

import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import api from "../lib/api";


export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("AdminGuard: No user found, redirecting to login");
        window.location.href = "/login";
        return;
      }

      setError(null);
      try {
        console.log("AdminGuard: Checking access for UID:", user.uid);
        const res = await api.get(`/users/${user.uid}/profile`);
        console.log("AdminGuard: Response data:", res.data);

        const role = res.data?.user_info?.role;
        const username = res.data?.user_info?.username;

        if (role === "admin" || username === "admin") {
          console.log("AdminGuard: Access GRANTED");
          setAllowed(true);
        } else {
          console.warn("AdminGuard: Access DENIED. Role:", role, "Username:", username);
          setError(`Access Denied: You are logged in as ${user.email} but do not have admin privileges. Role: ${role}`);
        }
      } catch (err: any) {
        console.error("AdminGuard: API Error:", err);
        setError(`Failed to verify admin status: ${err.message || "Unknown error"}. Check console for details.`);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-foreground">Verifying administrator credentials...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full card-elevated p-8 border-t-4 border-destructive text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Restricted</h1>
          <p className="text-foreground/80 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Retry Verification
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );

  return allowed ? <>{children}</> : null;
}
