"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, CheckCircle, AlertCircle, Heart, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  /* 🔐 Redirect if already logged in */
  useEffect(() => {
    if (!authLoading && authUser) {
      if (authUser.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/feed");
      }
    }
  }, [authUser, authLoading, router]);

  /* ---------------- EMAIL LOGIN ---------------- */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMsg("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Let useEffect handle redirect based on role once synced
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && (err as any).code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- GOOGLE LOGIN ---------------- */
  const handleGoogleLogin = async () => {
    setError("");
    setResetMsg("");
    setLoading(true);

    // Clear any stale JWT so AuthContext doesn't block the new Firebase user from syncing
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Let useEffect handle redirect based on role once synced
    } catch (err: unknown) {
      setError("Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- PASSWORD RESET ---------------- */
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email to reset password");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Password reset email sent to your inbox.");
      setError("");
    } catch {
      setError("Failed to send reset email.");
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/30">

      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary via-primary to-primary/80 text-white relative items-center justify-center p-12 overflow-hidden">

        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-white/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
              <Heart className="w-12 h-12 text-white" fill="white" />
            </div>
            <h1 className="text-6xl font-bold mb-6 tracking-tight leading-tight">
              Welcome Back to
              <br />
              <span className="text-white/90">Openly</span>
            </h1>
            <p className="text-xl text-white/80 font-light leading-relaxed mb-8">
              Continue your journey of growth through shared failures and collective wisdom.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">10K+</div>
                <div className="text-sm text-white/70">Stories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">50K+</div>
                <div className="text-sm text-white/70">Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">4.9★</div>
                <div className="text-sm text-white/70">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="w-9 h-9 text-primary-foreground" fill="currentColor" />
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-bold mb-3 text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground text-lg">
              Sign in to continue your journey
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-6">
            {/* Error & Reset Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-3"
              >
                <AlertCircle size={20} /> {error}
              </motion.div>
            )}
            {resetMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm p-4 rounded-xl flex items-center gap-3"
              >
                <CheckCircle size={20} /> {resetMsg}
              </motion.div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Password</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full btn-secondary py-4 text-lg flex items-center justify-center gap-3"
            >
              <svg className="h-6 w-6" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 20.45c4.656 0 8.556-3.218 9.973-7.65h-9.973v-4.524h15.222c.159.833.242 1.693.242 2.578 0 8.019-5.748 13.913-13.828 13.913-7.729 0-14-6.271-14-14s6.271-14 14-14c3.784 0 7.211 1.396 9.872 3.882l-4.133 3.493c-1.554-1.121-3.601-1.785-5.739-1.785-5.188 0-9.471 3.978-11.042 9.006h-.033l-4.665-3.587-.146.108c1.677 5.95 7.152 10.354 13.671 10.354z" fill="currentColor" />
              </svg>
              Google
            </button>
          </form>

          <p className="mt-10 text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="font-bold text-primary hover:underline transition-colors"
            >
              Create an account
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
