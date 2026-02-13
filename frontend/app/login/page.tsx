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
    <div className="min-h-screen flex w-full relative overflow-hidden bg-background">

      {/* Background Ambience (Mobile/Global) */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 pointer-events-none" />

      {/* --- LEFT SIDE: ARTWORK --- */}
      <div className="hidden lg:flex w-1/2 bg-black text-white relative items-center justify-center p-12 overflow-hidden">
        {/* Abstract Background Shapes - Premium & Dark */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/30 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
              <img src="/assets/logo.png" alt="Openly" className="h-10 w-auto object-contain brightness-0 invert" />
            </div>
            <h1 className="text-5xl font-black mb-6 tracking-tight leading-[1.1] text-white">
              Share Failures. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Build Success.</span>
            </h1>
            <p className="text-xl text-gray-300 font-light leading-relaxed">
              &quot;Success is stumbling from failure to failure with no loss of enthusiasm.&quot;
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="font-serif italic font-bold">W</span>
              </div>
              <div>
                <p className="font-semibold text-white">Winston Churchill</p>
                <p className="text-xs text-gray-400">Former Prime Minister of the UK</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <div className="lg:hidden mb-6 flex justify-center">
              <img src="/assets/logo.png" alt="Openly" className="h-10 w-auto" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">
              Enter your details to access your account.
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Error & Reset Messages */}
            <div className="space-y-2">
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-xl flex items-center gap-3">
                  <AlertCircle size={18} /> {error}
                </motion.div>
              )}
              {resetMsg && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-3">
                  <CheckCircle size={18} /> {resetMsg}
                </motion.div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-xl px-10 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Password</label>
                  <button type="button" onClick={handleForgotPassword} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-xl px-10 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? "Signing in..." : <><span className="text-base">Sign In</span> <ArrowRight size={18} /></>}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-background px-4 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full bg-card hover:bg-muted/50 border border-border font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 text-foreground active:scale-[0.98]"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 20.45c4.656 0 8.556-3.218 9.973-7.65h-9.973v-4.524h15.222c.159.833.242 1.693.242 2.578 0 8.019-5.748 13.913-13.828 13.913-7.729 0-14-6.271-14-14s6.271-14 14-14c3.784 0 7.211 1.396 9.872 3.882l-4.133 3.493c-1.554-1.121-3.601-1.785-5.739-1.785-5.188 0-9.471 3.978-11.042 9.006h-.033l-4.665-3.587-.146.108c1.677 5.95 7.152 10.354 13.671 10.354z" fill="currentColor" />
              </svg>
              Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button onClick={() => router.push("/signup")} className="font-bold text-primary hover:underline transition-colors">
              Create an account
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
