"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Post, Comment } from "../types";
import { User } from "firebase/auth";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Eye,
  MoreVertical,
  Flag,
  Trash2,
  ImageIcon,
  Bookmark,
  CornerDownRight,
  Edit2,
  Archive,
  RefreshCcw,
  Check,
  X
} from "lucide-react";
import api, { getAbsUrl } from "../lib/api";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import ReportModal from "./ReportModal";
import ShareImageTemplate from "./ShareImageTemplate";
import { toPng } from "html-to-image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ---------------- HELPER COMPONENTS ---------------- */

const CommentItem = ({
  comment,
  currentUser,
  onReply,
  depth = 0
}: {
  comment: Comment,
  currentUser: User | null,
  onReply: (parentId: string, content: string) => void,
  depth?: number
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleSubmit = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText);
    setIsReplying(false);
    setReplyText("");
  };

  return (
    <div className={`mt-4 ${depth > 0 ? "relative" : ""}`}>
      {depth > 0 && (
        <div className="absolute -left-5 top-0 w-4 h-8 border-b border-l border-white/10 rounded-bl-xl" />
      )}

      <div className="flex gap-3 relative group">
        <img src={getAbsUrl(comment.user_pic)} className="w-6 h-6 rounded-full ring-1 ring-white/10" alt={comment.user_name} />
        <div className="flex-1">
          <div className="bg-white/5 rounded-2xl rounded-tl-none px-3 py-2 inline-block max-w-full">
            <span className="font-bold text-xs text-white mr-2 block mb-0.5">{comment.user_name}</span>
            <span className="text-xs text-indigo-100/80 leading-relaxed block whitespace-pre-wrap break-words">{comment.content}</span>
          </div>

          <div className="flex items-center gap-4 mt-1 ml-1">
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
              {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : 'Just now'}
            </span>
            {currentUser && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-[10px] text-white/50 hover:text-primary font-bold uppercase tracking-wider transition-colors"
              >
                Reply
              </button>
            )}
            {comment.id.startsWith('temp-') && <span className="text-[10px] text-white/30 italic">(Posting...)</span>}
          </div>
        </div>
      </div>

      {isReplying && (
        <div className="mt-3 ml-9 flex gap-2 animate-in fade-in slide-in-from-top-1">
          <CornerDownRight size={14} className="text-white/20 mt-2.5" />
          <input
            autoFocus
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.user_name}...`}
            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-all"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 border-l border-dashed border-white/10 pl-5">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} currentUser={currentUser} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

function buildCommentTree(comments: Comment[]): Comment[] {
  const map: { [key: string]: Comment } = {};
  const roots: Comment[] = [];

  // Deep copy to avoid mutating original state directly if objects are shared
  // and initialize replies
  comments.forEach(c => {
    map[c.id] = { ...c, replies: [] };
  });

  comments.forEach(c => {
    // If we have a parent_id AND that parent exists in our current set
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies!.push(map[c.id]);
    } else {
      // Top level (or parent not found/loaded)
      roots.push(map[c.id]);
    }
  });

  return roots;
}

function PostItem({ post }: { post: Post }) {
  /* ---------------- STATE ---------------- */
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Stats
  // Real view count from DB + local increment
  const [viewCount, setViewCount] = useState(post.view_count || 0);

  const [reactionCount, setReactionCount] = useState(post.reaction_count || 0);
  const [downvoteCount, setDownvoteCount] = useState(post.downvote_count || 0);

  const [hasReacted, setHasReacted] = useState(false);
  const [hasDownvoted, setHasDownvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false); // Loading state for upvote
  const [isDownvoting, setIsDownvoting] = useState(false); // Loading state for downvote

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [reportModalConfig, setReportModalConfig] = useState<{
    isOpen: boolean;
    targetId: string;
    targetType: "post" | "user";
  }>({
    isOpen: false,
    targetId: "",
    targetType: "post"
  });
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editContent, setEditContent] = useState(post.content);
  const [localIsArchived, setLocalIsArchived] = useState(post.is_archived || false);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const viewRecorded = useRef(false);

  /* ---------------- AUTH & VIEW ---------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);

      // Record view only once per session/mount and preferably if user is loaded (or guest)
      if (!viewRecorded.current) {
        viewRecorded.current = true;
        // Fire and forget
        api.post(`/posts/${post.id}/view`, { user_id: u ? u.uid : "guest" })
          .catch(err => console.error("View count error", err));
        setViewCount(v => v + 1); // Optimistic increment
      }
    });

    return () => unsubscribe();
  }, [post.id]);


  /* ---------------- HANDLERS ---------------- */
  const handleUpvote = useCallback(async () => {
    if (!currentUser) {
      toast.error("Please login to vote");
      return;
    }

    if (isUpvoting) return;

    // Optimistic
    const wasReacted = hasReacted;
    const wasDownvoted = hasDownvoted;

    // Toggle Upvote
    setHasReacted(!wasReacted);
    setReactionCount(c => wasReacted ? c - 1 : c + 1);

    // If was downvoted, remove downvote
    if (wasDownvoted) {
      setHasDownvoted(false);
      setDownvoteCount(c => c - 1);
    }

    setIsUpvoting(true);

    try {
      await api.post(`/posts/${post.id}/react`, { user_id: currentUser.uid });
    } catch (e) {
      // Rollback
      console.error("Upvote error:", e);
      setHasReacted(wasReacted);
      setReactionCount(c => wasReacted ? c : (wasReacted ? c + 1 : c - 1)); // Reset logic complex, simpler to just force reset but let's try to be precise
      // Just revert everything
      if (wasDownvoted) {
        setHasDownvoted(true);
        setDownvoteCount(c => c + 1);
      }
      setReactionCount(post.reaction_count || 0); // Fallback to prop might be safer if we track delta
      toast.error("Failed to update vote.");
    } finally {
      setIsUpvoting(false);
    }
  }, [currentUser, hasReacted, hasDownvoted, post.id, isUpvoting, post.reaction_count]);

  const handleDownvote = useCallback(async () => {
    if (!currentUser) {
      toast.error("Please login to vote");
      return;
    }
    if (isDownvoting) return;

    const wasDownvoted = hasDownvoted;
    const wasReacted = hasReacted;

    // Toggle Downvote
    setHasDownvoted(!wasDownvoted);
    setDownvoteCount(c => wasDownvoted ? c - 1 : c + 1);

    // If was upvoted, remove upvote
    if (wasReacted) {
      setHasReacted(false);
      setReactionCount(c => c - 1);
    }

    setIsDownvoting(true);

    try {
      await api.post(`/posts/${post.id}/downvote`, { user_id: currentUser.uid });
    } catch (e) {
      console.error("Downvote error", e);
      // Rollback
      setHasDownvoted(wasDownvoted);
      // Revert counts... implies more complex state tracking, simple revert:
      if (wasReacted) {
        setHasReacted(true);
        setReactionCount(c => c + 1);
      }
      setDownvoteCount(c => wasDownvoted ? c + 1 : c - 1);
      toast.error("Failed to downvote");
    } finally {
      setIsDownvoting(false);
    }
  }, [currentUser, hasReacted, hasDownvoted, isDownvoting, post.id]);

  const handleComment = useCallback(async (parentId: string | null = null, content: string = commentText) => {
    if (!content.trim() || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    const newCommentObj: Comment = {
      id: tempId,
      user_id: currentUser.uid,
      user_name: currentUser.displayName || "User",
      user_pic: currentUser.photoURL || "",
      content: content,
      created_at: new Date().toISOString(),
      parent_id: parentId || undefined
    };

    // Optimistic update
    setComments(prev => [...prev, newCommentObj]);
    if (!parentId) setCommentText(""); // Clear main input if top-level

    try {
      await api.post(`/posts/${post.id}/comments`, {
        user_id: currentUser.uid,
        user_name: currentUser.displayName,
        user_pic: currentUser.photoURL,
        content: newCommentObj.content,
        parent_id: parentId
      });

      // No need to replace tempId as we refetch or just let it be until refresh
    } catch (error) {
      console.error("Error posting comment:", error);
      // Rollback
      setComments(prev => prev.filter(c => c.id !== tempId));
      toast.error("Failed to post comment. Please try again.");
    }
  }, [commentText, currentUser, post.id]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  }, [post.id]);

  const handleBookmark = useCallback(async () => {
    if (!currentUser) {
      toast.error("Please login to bookmark");
      return;
    }

    // Optimistic Update
    setIsBookmarked((prev) => !prev);
    const newStatus = !isBookmarked;

    try {
      await api.post(`/posts/${post.id}/bookmark`, { user_id: currentUser.uid });
      toast.success(newStatus ? "Bookmarked!" : "Bookmark removed");
    } catch (error) {
      console.error("Bookmark error", error);
      setIsBookmarked(!newStatus); // Rollback
      toast.error("Failed to bookmark");
    }
  }, [currentUser, post.id, isBookmarked]);

  const handleUpdate = async () => {
    if (!currentUser || isUpdating) return;
    setIsUpdating(true);
    try {
      await api.patch(`/posts/${post.id}?user_id=${currentUser.uid}`, {
        title: editTitle,
        content: editContent
      });
      toast.success("Post updated!");
      setIsEditing(false);
      // Reload page or update parent state? For now, just show success. 
      // Ideally we'd have a global state update.
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update post");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    if (!currentUser) return;
    const action = localIsArchived ? "unarchive" : "archive";
    try {
      await api.post(`/posts/${post.id}/${action}?user_id=${currentUser.uid}`);
      setLocalIsArchived(!localIsArchived);
      toast.success(localIsArchived ? "Post unarchived!" : "Post archived!");
      setShowMenu(false);
    } catch (error) {
      toast.error(`Failed to ${action} post`);
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;

    try {
      await api.delete(`/posts/${post.id}/?user_id=${currentUser.uid}`);
      toast.success("Post deleted");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };


  /* ---------------- RENDER ---------------- */
  const formattedDate = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : "Recently";

  // Mock Tags based on category or content keywords
  const tags = [post.category || "General", "Review"];

  return (
    <div className="glass-card p-6 md:p-8 mb-6 relative overflow-hidden group/post transition-all duration-500">

      {/* 1. TOP TAGS & MENU */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-2">
          {tags.map((tag, i) => (
            <Link key={i} href={`/?category=${tag}`} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all ${i === 0 ? "bg-primary/10 text-primary" : "bg-purple-500/10 text-purple-400"}`}>
              {tag}
            </Link>
          ))}
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-muted-foreground/30 hover:text-foreground transition-colors hover:bg-white/5 rounded-xl"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 glass-premium rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {currentUser?.uid === post.user_id ? (
                <>
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-5 py-4 text-xs font-bold text-foreground hover:bg-white/5 transition-colors"
                  >
                    <Edit2 size={14} className="text-primary" />
                    Edit Post
                  </button>
                  <button
                    onClick={handleArchive}
                    className="w-full flex items-center gap-3 px-5 py-4 text-xs font-bold text-foreground hover:bg-white/5 transition-colors"
                  >
                    {localIsArchived ? <RefreshCcw size={14} className="text-emerald-500" /> : <Archive size={14} className="text-amber-500" />}
                    {localIsArchived ? "Unarchive Post" : "Archive Post"}
                  </button>
                  <div className="border-t border-border/30" />
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-3 px-5 py-4 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete Post
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setReportModalConfig({ isOpen: true, targetId: post.id, targetType: "post" }); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-5 py-4 text-xs font-bold text-foreground hover:bg-white/5 transition-colors"
                >
                  <Flag size={14} className="text-destructive" />
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. HEADER: AUTHOR */}
      <div className="flex gap-4 mb-6">
        {post.is_anonymous ? (
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-[1.25rem] overflow-hidden ring-4 ring-background shadow-lg">
              <img
                src={getAbsUrl("/assets/anonymous.png")}
                className="w-full h-full object-cover"
                alt="Anonymous Author"
              />
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                Anonymous
              </h4>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{formattedDate}</p>
            </div>
          </div>
        ) : (
          <Link href={`/u/${(post.username && post.username !== "@user" && post.username !== "@anonymous") ? post.username.replace('@', '') : post.user_id}`} className="flex gap-4 group/author">
            <div className="w-12 h-12 rounded-[1.25rem] overflow-hidden ring-4 ring-background shadow-lg transition-transform group-hover/author:scale-105">
              <img
                src={getAbsUrl(post.user_pic || post.author_pic)}
                className="w-full h-full object-cover"
                alt={post.user_name || "Author"}
              />
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground flex items-center gap-2 group-hover/author:text-primary transition-colors">
                {post.user_name || "User"}
                <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-black ring-1 ring-emerald-500/20">850</span>
              </h4>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{formattedDate}</p>
            </div>
          </Link>
        )}
      </div>

      {/* 3. CONTENT */}
      {isEditing ? (
        <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-2">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-white/5 dark:bg-card/50 border border-border/50 rounded-2xl px-5 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
            className="w-full bg-white/5 dark:bg-card/50 border border-border/50 rounded-2xl px-5 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleUpdate}
              disabled={isUpdating || !editContent.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <Check size={14} />
              Save Changes
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditTitle(post.title || ""); setEditContent(post.content); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-white/5 text-foreground rounded-xl text-xs font-bold hover:bg-white/10 transition-all border border-border"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          {post.title && (
            <Link href={`/post/${post.id}`}>
              <h3 className="text-xl md:text-2xl font-black text-foreground mb-3 leading-[1.2] tracking-tight group-hover/post:text-primary transition-colors">
                {post.title}
              </h3>
            </Link>
          )}
          <Link href={`/post/${post.id}`} className="block mb-2">
            <div className="markdown-content text-sm md:text-base font-medium leading-relaxed !text-muted-foreground/90">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content.length > 250 ? post.content.slice(0, 250) + "..." : post.content}
              </ReactMarkdown>
            </div>
            {post.content.length > 250 && (
              <span className="text-primary font-black text-[10px] uppercase tracking-widest mt-3 block hover:underline">Read full insight</span>
            )}
          </Link>
        </div>
      )}

      {post.image_url && (
        <div className="mb-6 rounded-3xl overflow-hidden border border-border/50 group/img relative cursor-pointer">
          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/img:opacity-100 transition-opacity z-10 flex items-center justify-center">
            <Eye className="text-white scale-150" />
          </div>
          <img src={getAbsUrl(post.image_url)} alt="Post attachment" className="w-full object-contain max-h-[500px] transition-transform duration-700 group-hover/img:scale-105" />
        </div>
      )}

      {/* 4. ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          {/* UPVOTE */}
          <button
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${hasReacted ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary"} ${isUpvoting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ThumbsUp size={16} className={hasReacted ? "fill-white" : ""} />
            <span>Support</span>
            {reactionCount > 0 && <span className="ml-1 opacity-80 pl-1 border-l border-current/20 font-black">{reactionCount}</span>}
          </button>

          {/* DOWNVOTE */}
          <button
            onClick={handleDownvote}
            disabled={isDownvoting}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${hasDownvoted ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-white/5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"} ${isDownvoting ? "opacity-50" : ""}`}
          >
            <ThumbsDown size={16} className={hasDownvoted ? "fill-destructive" : ""} />
            {downvoteCount > 0 && <span className="ml-1 opacity-80 pl-1 border-l border-current/20 font-black">{downvoteCount}</span>}
          </button>

          {/* COMMENT */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary text-xs font-bold transition-all group/btn"
          >
            <MessageSquare size={16} className="group-hover/btn:scale-110 transition-transform" />
            <span className="hidden sm:inline">Discuss</span>
            {(comments.length + (post.comments?.length || 0)) > 0 && <span className="ml-1 opacity-80 pl-1 border-l border-current/20 font-black">{comments.length + (post.comments?.length || 0)}</span>}
          </button>

          {/* SHARE */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground text-xs font-bold transition-all"
          >
            <Share2 size={16} />
          </button>

          {/* BOOKMARK */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl transition-all ${isBookmarked ? "bg-amber-500 text-white shadow-xl shadow-amber-500/20" : "bg-white/5 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600"}`}
          >
            <Bookmark size={16} className={isBookmarked ? "fill-white" : ""} />
          </button>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-1.5 p-2 bg-white/5 rounded-xl">
            <Eye size={14} className="text-muted-foreground/50" />
            <span>{viewCount} Views</span>
          </div>
        </div>
      </div>

      {/* COMMENTS SECTION */}
      {showComments && (
        <div className="bg-black/20 -mx-5 -mb-5 mt-5 p-5 border-t border-white/5 animate-in slide-in-from-top-2">

          {/* Main Input */}
          <div className="flex gap-3 mb-6">
            <img src={getAbsUrl(currentUser?.photoURL)} className="w-8 h-8 rounded-full ring-2 ring-white/10" alt="Your avatar" />
            <div className="flex-1 relative">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
              />
              <button
                onClick={() => handleComment()}
                disabled={!commentText.trim()}
                className="absolute right-2 top-1.5 p-1 text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CornerDownRight size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {buildCommentTree(comments).length === 0 ? (
              <div className="text-center text-white/20 py-8 text-sm italic">No comments yet. Be the first!</div>
            ) : (
              buildCommentTree(comments).map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUser={currentUser}
                  onReply={(parentId, content) => handleComment(parentId, content)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {currentUser && (
        <ReportModal
          isOpen={reportModalConfig.isOpen}
          onClose={() => setReportModalConfig({ ...reportModalConfig, isOpen: false })}
          targetId={reportModalConfig.targetId}
          targetType={reportModalConfig.targetType}
          reporterId={currentUser.uid}
        />
      )}
    </div>
  );
}

export default memo(PostItem);
