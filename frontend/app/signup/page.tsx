"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { motion } from "framer-motion";
import { Mail, Lock, CheckCircle, AlertCircle, ArrowRight, UserPlus, Shield } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* 🔐 Redirect if already logged in */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/feed");
    });
    return () => unsubscribe();
  }, [router]);

  /* ---------------- EMAIL SIGNUP ---------------- */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password should include at least one number and one capital letter");
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/setup-username");
    } catch (err: unknown) {
      const errorCode = (err as { code?: string }).code || "unknown";
      setError(getSignupErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- GOOGLE SIGNUP ---------------- */
  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/setup-username");
    } catch {
      setError("Google signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full relative overflow-hidden bg-background">

      {/* --- LEFT SIDE: ARTWORK --- */}
      <div className="hidden lg:flex w-1/2 bg-black text-white relative items-center justify-center p-12 overflow-hidden">
        {/* Background Image & Effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow delay-2000" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
              <img src="/assets/logo.png" alt="Openly" className="h-10 w-auto object-contain brightness-0 invert" />
            </div>
            <h1 className="text-5xl font-black mb-6 tracking-tight leading-[1.1] text-white">
              Join the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Revolution.</span>
            </h1>
            <p className="text-xl text-gray-300 font-light leading-relaxed">
              &quot;Your voice matters. Give suggestions that spark real change.&quot;
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/15 transition-all cursor-default group">
              <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-400 group-hover:scale-110 transition-transform"><UserPlus size={20} /></div>
              <div>
                <h4 className="font-bold text-white">Community Driven</h4>
                <p className="text-xs text-gray-400">Join thousands of others sharing insights.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/15 transition-all cursor-default group">
              <div className="p-2.5 bg-purple-500/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform"><Shield size={20} /></div>
              <div>
                <h4 className="font-bold text-white">Safe & Secure</h4>
                <p className="text-xs text-gray-400">Your data is protected with enterprise security.</p>
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
            <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Create Account</h2>
            <p className="text-muted-foreground">
              Give suggestions, read reviews, build better products.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">

            {/* Error Message */}
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-xl flex items-center gap-3">
                <AlertCircle size={18} /> {error}
              </motion.div>
            )}

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
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Password</label>
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Creating account..." : (
                <span className="flex items-center gap-2">Sign Up <ArrowRight size={18} /></span>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-background px-4 text-muted-foreground">
                  Or sign up with
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignup}
              className="w-full bg-card hover:bg-muted/50 border border-border font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 text-foreground active:scale-[0.98]"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 20.45c4.656 0 8.556-3.218 9.973-7.65h-9.973v-4.524h15.222c.159.833.242 1.693.242 2.578 0 8.019-5.748 13.913-13.828 13.913-7.729 0-14-6.271-14-14s6.271-14 14-14c3.784 0 7.211 1.396 9.872 3.882l-4.133 3.493c-1.554-1.121-3.601-1.785-5.739-1.785-5.188 0-9.471 3.978-11.042 9.006h-.033l-4.665-3.587-.146.108c1.677 5.95 7.152 10.354 13.671 10.354z" fill="currentColor" />
              </svg>
              Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => router.push("/login")} className="font-bold text-primary hover:underline transition-colors">
              Login
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* 🔧 Friendly Firebase Errors */
function getSignupErrorMessage(code: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/weak-password":
      return "Password is too weak";
    default:
      return "Signup failed. Please try again.";
  }
}
