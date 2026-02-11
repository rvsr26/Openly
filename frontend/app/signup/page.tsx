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
      if (user) router.push("/");
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
    <div className="min-h-screen flex w-full relative overflow-hidden">

      {/* --- LEFT SIDE: ARTWORK --- */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 text-white relative items-center justify-center p-12 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 z-0">
          <div className="absolute top-10 right-10 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-10">
            <img src="/assets/logo.png" alt="Openly" className="h-16 w-auto mb-8 object-contain" />
            <h1 className="text-5xl font-black mb-6 tracking-tight leading-none">
              Join the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">Revolution.</span>
            </h1>
            <p className="text-xl text-zinc-300 font-light leading-relaxed">
              &quot;Your voice matters. Give suggestions that spark change.&quot;
            </p>
            <p className="mt-4 text-zinc-500 font-mono text-sm">— Open Space</p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 transition hover:bg-white/10">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><UserPlus size={20} /></div>
              <div>
                <h4 className="font-bold">Transparent Insights</h4>
                <p className="text-xs text-zinc-400">Honest reviews from real users</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 transition hover:bg-white/10">
              <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400"><Shield size={20} /></div>
              <div>
                <h4 className="font-bold">Impactful Advice</h4>
                <p className="text-xs text-zinc-400">Share suggestions that matter</p>
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
          className="w-full max-w-md glass-card p-8 sm:p-10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="lg:hidden mb-6 flex justify-center">
              <img src="/assets/logo.png" alt="Openly" className="h-12 w-auto" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Create Account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Give suggestions, read reviews, build better products
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">

            {/* Error Message */}
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

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
                <label className="text-sm font-bold ml-1">Password</label>
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

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Creating account..." : (
                <span className="flex items-center gap-2">Sign Up <ArrowRight size={18} /></span>
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or sign up with
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignup}
              className="btn-secondary w-full flex items-center justify-center gap-2 border border-border"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 20.45c4.656 0 8.556-3.218 9.973-7.65h-9.973v-4.524h15.222c.159.833.242 1.693.242 2.578 0 8.019-5.748 13.913-13.828 13.913-7.729 0-14-6.271-14-14s6.271-14 14-14c3.784 0 7.211 1.396 9.872 3.882l-4.133 3.493c-1.554-1.121-3.601-1.785-5.739-1.785-5.188 0-9.471 3.978-11.042 9.006h-.033l-4.665-3.587-.146.108c1.677 5.95 7.152 10.354 13.671 10.354z" fill="currentColor" />
              </svg>
              Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => router.push("/login")} className="font-bold text-primary hover:underline">
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
