"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

interface Comment {
  id: string;
  user_name: string;
  user_pic: string;
  content: string;
}

export default function PostItem({ post }: { post: any }) {
  const router = useRouter();

  /* ---------------- STATE ---------------- */
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [views, setViews] = useState(post.view_count || 0);
  const [hasViewed, setHasViewed] = useState(false);

  const [reactions, setReactions] = useState(post.reaction_count || 0);
  const [hasReacted, setHasReacted] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ---------------- AUTH + VIEW TRACK ---------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user && !hasViewed) {
        recordView(user.uid);
      }
    });

    return () => unsubscribe();
  }, [post.id, hasViewed]);

  const recordView = async (userId: string) => {
    try {
      setHasViewed(true);
      await axios.post(
        `http://127.0.0.1:8000/posts/${post.id}/view`,
        { user_id: userId }
      );
      setViews((v: number) => v + 1);
    } catch (e) {
      console.error("View error", e);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async () => {
    if (!currentUser) return;
    if (!confirm("Delete this post permanently?")) return;

    try {
      setIsDeleting(true);
      await axios.delete(
        `http://127.0.0.1:8000/posts/${post.id}?user_id=${currentUser.uid}`
      );
      setIsDeleted(true);
    } catch (e) {
      alert("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------------- REACTIONS ---------------- */
  const handleReaction = async () => {
    if (!currentUser || isReacting) return;

    const next = !hasReacted;
    setHasReacted(next);
    setReactions((r: number) => (next ? r + 1 : r - 1));
    setIsReacting(true);

    try {
      await axios.post(
        `http://127.0.0.1:8000/posts/${post.id}/react`,
        { user_id: currentUser.uid }
      );
    } catch {
      setHasReacted(!next);
      setReactions((r: number) => (!next ? r + 1 : r - 1));
    } finally {
      setIsReacting(false);
    }
  };

  /* ---------------- COMMENTS ---------------- */
  const toggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/posts/${post.id}/comments`
        );
        setComments(res.data || []);
      } catch (e) {
        console.error("Comments error", e);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handlePostComment = async () => {
    if (!currentUser || !newComment.trim()) return;

    const temp = {
      id: Date.now().toString(),
      user_name: currentUser.displayName || "You",
      user_pic: currentUser.photoURL || "",
      content: newComment,
    };

    setComments((c) => [...c, temp]);
    setNewComment("");

    try {
      await axios.post(
        `http://127.0.0.1:8000/posts/${post.id}/comments`,
        {
          content: temp.content,
          user_id: currentUser.uid,
          user_name: temp.user_name,
          user_pic: temp.user_pic,
        }
      );
    } catch {
      alert("Failed to post comment");
    }
  };

  /* ---------------- EXIT IF DELETED ---------------- */
  if (isDeleted) return null;

  const isAuthor = currentUser?.uid === post.user_id;
  const username = post.username?.replace("@", "");

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-300 mb-4 overflow-hidden relative group">
      
      {/* AUTHOR ACTIONS */}
      {isAuthor && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => router.push(`/edit-post/${post.id}`)}
            className="text-gray-400 hover:text-blue-600"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <div className="p-4">
        {/* HEADER */}
        <div className="flex gap-3 mb-2">
          <img
            src={
              post.is_anonymous
                ? "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                : post.user_pic || "https://via.placeholder.com/40"
            }
            className="w-10 h-10 rounded-full"
          />

          <div>
            <h3 className="font-semibold text-sm">
              {post.is_anonymous ? (
                "Anonymous"
              ) : (
                <Link
                  href={`/u/${username}`}
                  className="hover:underline"
                >
                  {post.user_name}
                </Link>
              )}
            </h3>

            <p className="text-xs text-gray-500">
              {post.category}
            </p>
          </div>
        </div>

        {/* CONTENT */}
        <p className="text-sm text-gray-800 leading-relaxed mb-3">
          {post.content}
        </p>

        {/* IMAGE */}
        {post.image_url && (
          <img
            src={post.image_url}
            className="w-full max-h-96 object-cover rounded-lg border mb-3"
          />
        )}

        {/* FOOTER */}
        <div className="border-t border-gray-100 pt-2 flex justify-between text-xs text-gray-500">
          <span>{views} views</span>

          <div className="flex gap-4">
            <button
              onClick={handleReaction}
              className={hasReacted ? "text-blue-600 font-bold" : ""}
            >
              {reactions} Respects
            </button>

            <button onClick={toggleComments}>
              {comments.length} Comments
            </button>
          </div>
        </div>
      </div>

      {/* COMMENTS */}
      {showComments && (
        <div className="bg-gray-50 p-4 border-t">
          {loadingComments && (
            <p className="text-xs text-gray-400">Loading comments…</p>
          )}

          <div className="space-y-3 mb-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <img
                  src={c.user_pic || "https://via.placeholder.com/30"}
                  className="w-8 h-8 rounded-full"
                />
                <div className="bg-white p-2 rounded-lg border text-sm">
                  <span className="font-bold block text-xs">
                    {c.user_name}
                  </span>
                  <p>{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          {currentUser && (
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handlePostComment()
                }
                placeholder="Add a comment…"
                className="flex-1 border rounded-full px-4 py-2 text-sm"
              />
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim()}
                className="text-blue-600 font-bold text-sm"
              >
                Post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
