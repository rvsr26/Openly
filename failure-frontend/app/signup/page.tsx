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
    } catch (err: any) {
      setError(getSignupErrorMessage(err.code));
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
    <main className="signup-wrapper">
      <form className="signup-card" onSubmit={handleSignup}>
        <h1>Create Account 🚀</h1>
        <p className="subtitle">
          Share your failures, learn together, grow stronger
        </p>

        {error && <div className="error">{error}</div>}

        <input
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <div className="divider">OR</div>

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          Sign up with Google
        </button>

        <p className="switch">
          Already have an account?
          <span onClick={() => router.push("/login")}> Login</span>
        </p>
      </form>

      {/* STYLES */}
      <style jsx>{`
        .signup-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fff7f0, #fdecea);
          padding: 1rem;
        }

        .signup-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          padding: 2.6rem;
          border-radius: 20px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
          animation: fadeUp 0.4s ease;
        }

        h1 {
          text-align: center;
          font-size: 1.85rem;
          margin-bottom: 0.4rem;
        }

        .subtitle {
          text-align: center;
          color: #7d8a9a;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }

        input {
          width: 100%;
          padding: 14px 16px;
          margin-bottom: 1.1rem;
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
          padding: 14px;
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
          cursor: not-allowed;
        }

        .google-btn {
          background: #121826;
        }

        .divider {
          text-align: center;
          margin: 1.4rem 0;
          color: #9aa4b2;
          font-size: 0.85rem;
        }

        .error {
          background: #fdecea;
          color: #e74c3c;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 1.1rem;
          text-align: center;
          font-size: 0.9rem;
        }

        .switch {
          text-align: center;
          margin-top: 1.8rem;
          font-size: 0.9rem;
          color: #7d8a9a;
        }

        .switch span {
          color: #e92c40;
          font-weight: 600;
          cursor: pointer;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
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
