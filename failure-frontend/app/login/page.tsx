"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";

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
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code));
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
    } catch (err: any) {
      setError("Google login failed. Try again.");
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
      setResetMsg("Password reset email sent");
      setError("");
    } catch {
      setError("Failed to send reset email");
    }
  };

  return (
    <main className="login-wrapper">
      <form className="login-card" onSubmit={handleEmailLogin}>
        <h1>Welcome Back 👋</h1>
        <p className="subtitle">Login to continue sharing & learning</p>

        {error && <div className="error">{error}</div>}
        {resetMsg && <div className="success">{resetMsg}</div>}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          type="button"
          className="forgot"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </button>

        <div className="divider">OR</div>

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Continue with Google
        </button>

        <p className="signup-link">
          Don’t have an account?
          <span onClick={() => router.push("/signup")}> Create one</span>
        </p>
      </form>

      {/* STYLES */}
      <style jsx>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fff7f0, #fdecea);
          padding: 1rem;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          padding: 2.5rem;
          border-radius: 18px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
          animation: fadeUp 0.4s ease;
        }

        h1 {
          text-align: center;
          font-size: 1.8rem;
          margin-bottom: 0.3rem;
        }

        .subtitle {
          text-align: center;
          color: #7d8a9a;
          margin-bottom: 1.8rem;
          font-size: 0.95rem;
        }

        input {
          width: 100%;
          padding: 13px 15px;
          margin-bottom: 1rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          font-size: 1rem;
        }

        input:focus {
          outline: none;
          border-color: #e92c40;
        }

        button {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #e92c40, #cc2535);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.7;
        }

        .forgot {
          background: none;
          color: #6b7280;
          font-size: 0.85rem;
          margin-top: 0.6rem;
        }

        .google-btn {
          background: #121826;
        }

        .divider {
          text-align: center;
          margin: 1.3rem 0;
          color: #9aa4b2;
          font-size: 0.85rem;
        }

        .error {
          background: #fdecea;
          color: #e74c3c;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .success {
          background: #ecfdf5;
          color: #047857;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .signup-link {
          text-align: center;
          margin-top: 1.6rem;
          font-size: 0.9rem;
          color: #7d8a9a;
        }

        .signup-link span {
          color: #e92c40;
          font-weight: 600;
          cursor: pointer;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

/* 🔧 Firebase error mapper */
function getAuthErrorMessage(code: string) {
  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/too-many-requests":
      return "Too many attempts. Try later.";
    default:
      return "Login failed. Please try again.";
  }
}
