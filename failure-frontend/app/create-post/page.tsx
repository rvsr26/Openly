"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { auth } from "../firebase";

const MAX_CHARS = 500;

export default function CreatePostPage() {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    if (content.length < 10) {
      setError("Post should be at least 10 characters");
      return;
    }

    if (content.length > MAX_CHARS) {
      setError(`Post cannot exceed ${MAX_CHARS} characters`);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    const userName =
      user.displayName && user.displayName.trim().length > 0
        ? user.displayName
        : "Anonymous";

    setLoading(true);

    try {
      await axios.post("http://127.0.0.1:8000/posts/", {
        user_id: user.uid,
        user_name: userName,        // ✅ REQUIRED
        user_pic: user.photoURL || null,
        content: content.trim(),
        is_anonymous: anonymous,
      });

      router.push("/");
    } catch (err: any) {
      console.error("CREATE POST ERROR:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create post. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="create-wrapper">
      <form className="create-card" onSubmit={handleSubmit}>
        <h1>Share a Failure 💭</h1>
        <p className="subtitle">Your story may help someone else grow</p>

        {error && <div className="error">{error}</div>}

        {/* CONTENT */}
        <textarea
          placeholder="What went wrong? What did you learn?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
        />

        {/* CHARACTER COUNT */}
        <div className="char-count">
          {content.length}/{MAX_CHARS}
        </div>

        {/* ANONYMOUS */}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          Post anonymously
        </label>

        {/* ACTIONS */}
        <div className="actions">
          <button
            type="button"
            className="cancel"
            onClick={() => router.back()}
          >
            Cancel
          </button>

          <button type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      {/* STYLES */}
      <style jsx>{`
        .create-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fff7f0, #fdecea);
          padding: 1rem;
        }

        .create-card {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          padding: 2.6rem;
          border-radius: 20px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
          animation: fadeUp 0.4s ease;
        }

        h1 {
          text-align: center;
          font-size: 1.9rem;
          margin-bottom: 0.4rem;
        }

        .subtitle {
          text-align: center;
          color: #7d8a9a;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }

        textarea {
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          font-size: 1rem;
          resize: none;
        }

        textarea:focus {
          outline: none;
          border-color: #e92c40;
        }

        .char-count {
          text-align: right;
          font-size: 0.75rem;
          color: #9aa4b2;
          margin: 0.3rem 0 1rem;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.9rem;
          color: #555;
          margin-bottom: 2rem;
        }

        .actions {
          display: flex;
          gap: 1rem;
        }

        .cancel {
          flex: 1;
          background: #f3f4f6;
          color: #333;
        }

        button {
          flex: 2;
          padding: 14px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #e92c40, #cc2535);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(233, 44, 64, 0.35);
        }

        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error {
          background: #fdecea;
          color: #e74c3c;
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 1.2rem;
          text-align: center;
          font-size: 0.9rem;
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
