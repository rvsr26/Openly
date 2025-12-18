"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

interface Comment {
  id: string;
  user_name: string;
  user_pic: string;
  content: string;
}

export default function PostItem({ post }: { post: any }) {
  // --- STATE ---
  const [views, setViews] = useState(post.view_count || 0);
  const [hasViewed, setHasViewed] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const [reactions, setReactions] = useState(post.reaction_count || 0);
  const [hasReacted, setHasReacted] = useState(false); 
  const [isReacting, setIsReacting] = useState(false);

  // Hide post if deleted
  const [isDeleted, setIsDeleted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- 1. AUTH & VIEW TRACKING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && !hasViewed) {
        recordView(user.uid);
      }
    });
    return () => unsubscribe();
  }, [post.id]);

  const recordView = async (userId: string) => {
    try {
      setHasViewed(true);
      const res = await axios.post(`http://127.0.0.1:8000/posts/${post.id}/view`, { user_id: userId });
      if (res.data.status === "view_counted") {
        setViews((prev: number) => prev + 1);
      }
    } catch (e) { console.error(e); }
  };

  // --- 2. DELETE LOGIC ---
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/posts/${post.id}?user_id=${currentUser.uid}`);
      setIsDeleted(true); 
    } catch (error) {
      alert("Failed to delete post.");
      console.error(error);
    }
  };

  // --- 3. REACTION LOGIC ---
  const handleReaction = async () => {
    if (!currentUser || isReacting) return;
    
    setIsReacting(true);
    // Optimistic Update
    const newHasReacted = !hasReacted;
    setHasReacted(newHasReacted);
    setReactions((prev: number) => newHasReacted ? prev + 1 : prev - 1);

    try {
      await axios.post(`http://127.0.0.1:8000/posts/${post.id}/react`, { user_id: currentUser.uid });
    } catch (error) {
      // Revert if failed
      setHasReacted(!newHasReacted);
      setReactions((prev: number) => !newHasReacted ? prev + 1 : prev - 1);
    }
    setIsReacting(false);
  };

  // --- 4. COMMENT LOGIC ---
  const toggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const res = await axios.get(`http://127.0.0.1:8000/posts/${post.id}/comments`);
        setComments(res.data);
      } catch (e) { console.error("Failed comments", e); }
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handlePostComment = async () => {
    if (!currentUser || !newComment.trim()) return;
    
    try {
      const tempComment = {
        id: Date.now().toString(),
        user_name: currentUser.displayName || "Me",
        user_pic: currentUser.photoURL || "",
        content: newComment
      };
      setComments([...comments, tempComment]);
      setNewComment(""); 

      await axios.post(`http://127.0.0.1:8000/posts/${post.id}/comments`, {
        content: tempComment.content,
        user_id: currentUser.uid,
        user_name: tempComment.user_name,
        user_pic: tempComment.user_pic
      });
    } catch (e) { alert("Failed to post comment"); }
  };

  // IF DELETED, RENDER NOTHING
  if (isDeleted) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-300 mb-3 overflow-hidden relative group">
      
      {/* DELETE BUTTON (Only visible to Author) */}
      {currentUser && (currentUser.uid === post.user_id || post.author === currentUser.displayName) && (
        <button 
          onClick={handleDelete}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete Post"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      )}

      <div className="p-4">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex gap-2">
            <img 
              src={post.author === "Anonymous" ? "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" : (post.author_pic || "https://via.placeholder.com/40")} 
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{post.author}</h3>
                {/* --- NEW: USERNAME DISPLAY --- */}
                {!post.is_anonymous && post.username && (
                   <span className="text-xs text-gray-500">{post.username}</span>
                )}
                {/* ----------------------------- */}
              </div>
              <p className="text-xs text-gray-500">Posted in {post.category}</p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 border border-gray-200 px-2 py-1 rounded">
            AI Classified
          </span>
        </div>

        {/* CONTENT */}
        <p className="text-sm text-gray-800 leading-relaxed mb-3">{post.content}</p>

        {/* IMAGE */}
        {post.image_url && (
          <div className="mb-3 rounded-lg overflow-hidden border border-gray-100">
            <img src={post.image_url} alt="Attachment" className="w-full h-auto object-cover max-h-96"/>
          </div>
        )}

        {/* STATS BAR */}
        <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-xs text-gray-500">
          
          {/* Views */}
          <div className="flex items-center gap-1">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
             <span>{views} views</span>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button 
              onClick={handleReaction}
              className={`flex items-center gap-1 transition-colors ${
                hasReacted ? "text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-4 h-4" fill={hasReacted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>{reactions} Respects</span>
            </button>

            <button onClick={toggleComments} className="hover:text-blue-600 hover:underline flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              <span>{comments.length > 0 ? comments.length : ""} Comment</span>
            </button>
          </div>
        </div>
      </div>

      {/* COMMENTS EXPANDED */}
      {showComments && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="space-y-4 mb-4">
            {loadingComments && <p className="text-xs text-gray-400">Loading...</p>}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <img src={c.user_pic || "https://via.placeholder.com/30"} className="w-8 h-8 rounded-full" />
                <div className="bg-white p-2 rounded-r-lg rounded-bl-lg shadow-sm border border-gray-200 text-sm">
                  <span className="font-bold block text-xs text-gray-700">{c.user_name}</span>
                  <p className="text-gray-800">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          {currentUser && (
            <div className="flex gap-2">
              <img src={currentUser.photoURL || "https://via.placeholder.com/32"} className="w-8 h-8 rounded-full mt-1"/>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  placeholder="Add a comment..."
                  className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-gray-500"
                />
                <button 
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className="absolute right-2 top-1.5 text-blue-600 font-bold text-xs hover:bg-blue-50 px-2 py-1 rounded disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}