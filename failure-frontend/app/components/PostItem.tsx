"use client";

import { useState, useEffect, useRef } from "react";
import { Post, Comment } from "../types";
import { User } from "firebase/auth";
import { auth } from "../firebase";
import {
  Heart,
  MessageCircle,
  Trash2,
  Share2,
  BarChart2,
  Send,
  Bookmark,
  Flag,
  Image as ImageIcon
} from "lucide-react";
import axios from "axios";
import api, { getAbsUrl } from "../lib/api";

import { formatDistanceToNow } from "date-fns";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import ReportModal from "./ReportModal";
import ShareImageTemplate from "./ShareImageTemplate";
import { toPng } from "html-to-image";

export default function PostItem({ post }: { post: Post }) {
  /* ---------------- STATE ---------------- */
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Stats
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [views] = useState(post.view_count || 0);

  const [reactionCount, setReactionCount] = useState(post.reaction_count || 0);
  const [hasReacted, setHasReacted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");

  const [isHoveringUser, setIsHoveringUser] = useState(false);

  // Reporting State
  const [reportModalConfig, setReportModalConfig] = useState<{
    isOpen: boolean;
    targetId: string;
    targetType: "post" | "user";
  }>({
    isOpen: false,
    targetId: "",
    targetType: "post"
  });

  /* ---------------- AUTH + VIEW TRACK ---------------- */
  useEffect(() => {
    const checkBookmarkStatus = async (userId: string) => {
      try {
        const res = await api.get(`/posts/${post.id}/bookmark-status?user_id=${userId}`);
        setIsBookmarked(res.data.is_bookmarked);
      } catch (e) {
        console.error("Failed to fetch bookmark status:", e);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u) {
        checkBookmarkStatus(u.uid);
      }
    });
    return () => unsubscribe();
  }, [post.id]);


  /* ---------------- HANDLERS ---------------- */
  const handleReact = async () => {
    if (!currentUser) return;
    const next = !hasReacted;
    setHasReacted(next);
    setReactionCount((r: number) => (next ? r + 1 : r - 1));

    // API call mock
    try {
      await api.post(`/posts/${post.id}/like`);
    } catch (e) { console.error(e); }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !currentUser) return;

    try {
      const tempId = Date.now().toString();
      const newCommentObj: Comment = {
        id: tempId,
        user_id: currentUser.uid,
        user_name: currentUser.displayName || "User",
        user_pic: currentUser.photoURL || "",
        content: commentText,
        created_at: new Date().toISOString()
      };
      setComments([...comments, newCommentObj]);
      setCommentText("");

      await api.post(`/posts/${post.id}/comments`, {
        user_id: currentUser.uid,
        user_name: currentUser.displayName,
        user_pic: currentUser.photoURL,
        content: newCommentObj.content
      });
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      toast.error("Please login to bookmark posts");
      return;
    }

    const nextStatus = !isBookmarked;
    setIsBookmarked(nextStatus);

    try {
      await api.post(`/posts/${post.id}/bookmark`, {
        user_id: currentUser.uid
      });
      toast.success(nextStatus ? "Post saved!" : "Post removed from bookmarks");
    } catch (e) {
      console.error(e);
      setIsBookmarked(!nextStatus); // Revert on error
      toast.error("Failed to save post");
    }
  };

  /* ---------------- SHARE AS IMAGE ---------------- */
  const templateRef = useRef<HTMLDivElement>(null);

  const handleShareAsImage = async () => {
    if (!templateRef.current) return;

    const toastId = toast.loading("Generating your beautiful card...");

    try {
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await toPng(templateRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#6366f1",
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `openly-story-${post.id.slice(-4)}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Image generated successfully!", { id: toastId });
    } catch (err) {
      console.error("Image generation failed:", err);
      // Log more details if available
      if (err instanceof Error) {
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);
      }
      toast.error("Failed to generate image", { id: toastId });
    }
  };

  const formattedDate = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : "Recently";

  return (
    <div className="glass-card group overflow-hidden mb-8 transition-all duration-700 hover:-translate-y-2 border border-white/20 dark:border-white/5 premium-shadow">

      {/* HEADER */}
      <div className="p-6 flex gap-4 items-center">
        <div
          className="relative group/avatar"
          onMouseEnter={() => setIsHoveringUser(true)}
          onMouseLeave={() => setIsHoveringUser(false)}
        >
          <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-violet-500 rounded-full blur opacity-0 group-hover/avatar:opacity-40 transition-opacity duration-500"></div>
          <img
            src={getAbsUrl(post.is_anonymous ? "/assets/anonymous.png" : (post.user_pic || post.author_pic))}
            alt="Author"
            className="relative w-12 h-12 rounded-2xl object-cover ring-2 ring-white/50 dark:ring-zinc-800/50 group-hover:rotate-3 transition-all duration-500"
          />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-lg tracking-tight text-foreground flex items-center gap-2">
                <span className={post.is_anonymous ? "" : "text-gradient"}>
                  {post.is_anonymous ? "Anonymous Contributor" : (post.user_name || post.username || post.author || "Contributor")}
                </span>
                {!post.is_anonymous && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-lg">PRO</span>
                )}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{formattedDate}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{post.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Delete Option if Owner (Mock) */}
              {currentUser && (post.user_id === currentUser.uid) && (
                <button className="text-muted-foreground hover:text-destructive transition-all p-2 rounded-xl hover:bg-destructive/10">
                  <Trash2 size={16} />
                </button>
              )}

              {/* Report Option if NOT Owner */}
              {currentUser && post.user_id !== currentUser.uid && (
                <button
                  onClick={() => setReportModalConfig({ isOpen: true, targetId: post.id, targetType: "post" })}
                  className="text-muted-foreground hover:text-rose-500 transition-all p-2 rounded-xl hover:bg-rose-500/10"
                  title="Report Content"
                >
                  <Flag size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 pb-4">
        <p className="text-base md:text-lg text-foreground/80 leading-relaxed font-medium transition-colors group-hover:text-foreground">
          {post.content}
        </p>

        {post.image_url && (
          <div className="mt-4 rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 group-hover:border-primary/30 transition-all duration-500">
            <img src={post.image_url} alt="Post Attachment" className="w-full h-auto object-cover max-h-[500px] transition-transform duration-700 group-hover:scale-105" />
          </div>
        )}
      </div>

      {/* ACTION BAR */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-white/10 mt-2 bg-primary/[0.02] backdrop-blur-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={handleReact}
            className={`group/btn flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 ${hasReacted ? "bg-rose-500/10 text-rose-500" : "hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"}`}
          >
            <Heart size={18} className={hasReacted ? "fill-current" : "transition-transform group-hover/btn:scale-110"} />
            <span className="text-xs font-black">{reactionCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="group/btn flex items-center gap-2 px-4 py-2 rounded-2xl hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 transition-all duration-300"
          >
            <MessageCircle size={18} className="transition-transform group-hover/btn:scale-110" />
            <span className="text-xs font-black">{comments.length}</span>
          </button>

          <div className="h-6 w-[1px] bg-white/10 mx-1"></div>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-all duration-300"
            title="Copy Link"
          >
            <Share2 size={18} />
          </button>

          <button
            onClick={handleShareAsImage}
            className="p-2.5 rounded-xl hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-500 transition-all duration-300"
            title="Share as Insight Card"
          >
            <ImageIcon size={18} />
          </button>

          <button
            onClick={handleBookmark}
            className={`p-2.5 rounded-xl transition-all duration-300 ${isBookmarked ? "bg-amber-500/10 text-amber-500" : "hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500"}`}
          >
            <Bookmark size={18} className={isBookmarked ? "fill-current" : ""} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/10 dark:bg-zinc-100/5 rounded-xl">
          <BarChart2 size={14} className="text-muted-foreground" />
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{views} views</span>
        </div>
      </div>

      {/* COMMENTS SECTION */}
      {showComments && (
        <div className="bg-primary/[0.03] p-6 border-t border-white/10 animate-in slide-in-from-top-4 duration-500">
          <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 group/comment">
                <img src={getAbsUrl(c.user_pic)} alt={`${c.user_name}'s avatar`} className="w-8 h-8 rounded-xl object-cover ring-2 ring-white/20" />
                <div className="flex-1 bg-white/40 dark:bg-zinc-800/40 p-3 rounded-2xl border border-white/20 hover:border-primary/20 transition-all duration-300">
                  <p className="text-xs font-black text-primary mb-1 uppercase tracking-widest">@{c.user_name}</p>
                  <p className="text-sm font-medium text-foreground/90">{c.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No feedback yet. Start the conversation!</p>
              </div>
            )}
          </div>

          <div className="relative">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a supportive comment..."
              className="w-full bg-white/50 dark:bg-zinc-950/50 border border-white/20 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50 transition-all shadow-inner"
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="absolute right-2 top-1.5 p-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 disabled:opacity-30 transition-all shadow-lg active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {currentUser && (
        <ReportModal
          isOpen={reportModalConfig.isOpen}
          onClose={() => setReportModalConfig({ ...reportModalConfig, isOpen: false })}
          targetId={reportModalConfig.targetId}
          targetType={reportModalConfig.targetType}
          reporterId={currentUser.uid}
        />
      )}

      {/* SHARE IMAGE TEMPLATE (Hidden from UI but available for capture) */}
      <ShareImageTemplate ref={templateRef} post={post} />

    </div>
  );
}
