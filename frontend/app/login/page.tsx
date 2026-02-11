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
import { Mail, Lock, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  /* 🔐 Redirect if already logged in */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/");
    });
    return () => unsubscribe();
  }, [router]);

  /* ---------------- EMAIL LOGIN ---------------- */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMsg("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
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

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
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
    <div className="min-h-screen flex w-full relative overflow-hidden">

      {/* Background Ambience for Mobile (Global one handles it, but we ensure transparency) */}

      {/* --- LEFT SIDE: ARTWORK --- */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 text-white relative items-center justify-center p-12 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 z-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-10">
            <img src="/assets/logo.png" alt="Openly" className="h-16 w-auto mb-8 object-contain" />
            <h1 className="text-5xl font-black mb-6 tracking-tight leading-none">
              Share Failures. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Build Success.</span>
            </h1>
            <p className="text-xl text-zinc-300 font-light leading-relaxed">
              &quot;Success is stumbling from failure to failure with no loss of enthusiasm.&quot;
            </p>
            <p className="mt-4 text-zinc-500 font-mono text-sm">— Winston Churchill</p>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 relative z-10">

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass-card p-8 sm:p-10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="lg:hidden mb-6 flex justify-center">
              <img src="/assets/logo.png" alt="Openly" className="h-12 w-auto" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Welcome Back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to continue your journey
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Error & Reset Messages */}
            <div className="space-y-2">
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </motion.div>
              )}
              {resetMsg && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-emerald-500/15 text-emerald-500 text-sm p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle size={16} /> {resetMsg}
                </motion.div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold ml-1">Password</label>
                  <button type="button" onClick={handleForgotPassword} className="text-xs font-medium text-primary hover:underline">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? "Signing in..." : <><ArrowRight size={18} /> Sign In</>}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="btn-secondary w-full flex items-center justify-center gap-2 border border-border"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 20.45c4.656 0 8.556-3.218 9.973-7.65h-9.973v-4.524h15.222c.159.833.242 1.693.242 2.578 0 8.019-5.748 13.913-13.828 13.913-7.729 0-14-6.271-14-14s6.271-14 14-14c3.784 0 7.211 1.396 9.872 3.882l-4.133 3.493c-1.554-1.121-3.601-1.785-5.739-1.785-5.188 0-9.471 3.978-11.042 9.006h-.033l-4.665-3.587-.146.108c1.677 5.95 7.152 10.354 13.671 10.354z" fill="currentColor" />
              </svg>
              Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button onClick={() => router.push("/signup")} className="font-bold text-primary hover:underline">
              Sign Up
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
