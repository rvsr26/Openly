"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api, { getAbsUrl } from "../lib/api";
import { auth } from "../firebase";
import { StoryGroup } from "../types";
import { Plus, X, Camera, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

export default function StoriesBar() {
    const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Viewer State
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerGroups, setViewerGroups] = useState<StoryGroup[]>([]);
    const [viewerInitialGroupIndex, setViewerInitialGroupIndex] = useState(0);

    const fetchStories = async () => {
        if (!auth.currentUser) return;
        try {
            const res = await api.get(`/stories/feed?user_id=${auth.currentUser.uid}`);
            setStoryGroups(res.data);
        } catch (e) {
            console.error("Failed to fetch stories", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchStories();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !auth.currentUser) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large. Max 5MB.");
            return;
        }

        setUploading(true);
        try {
            // 1. Upload media
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await api.post("/posts/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            const imageUrl = uploadRes.data.url;

            // 2. Create Story
            await api.post("/stories", {
                user_id: auth.currentUser.uid,
                image_url: imageUrl,
                background_color: "#000000"
            });

            toast.success("Story posted!");
            fetchStories(); // Refresh feed
        } catch (err) {
            console.error(err);
            toast.error("Failed to post story.");
        } finally {
            setUploading(false);
            setIsCreating(false);
        }
    };

    const openViewer = (groupIndex: number) => {
        setViewerGroups(storyGroups);
        setViewerInitialGroupIndex(groupIndex);
        setViewerOpen(true);
    };

    const handleStoryViewed = async (storyId: string) => {
        if (!auth.currentUser) return;
        try {
            await api.post(`/stories/${storyId}/view?viewer_id=${auth.currentUser.uid}`);
            // Optimistically update local state so ring goes gray
            setStoryGroups(prev => [...prev]);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide py-6 h-[120px] items-center">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-secondary"></div>
                        <div className="w-12 h-2 bg-secondary rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    const myGroup = storyGroups.find(g => g.user_id === auth.currentUser?.uid);
    const otherGroups = storyGroups.filter(g => g.user_id !== auth.currentUser?.uid);

    return (
        <div className="relative">
            <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide py-6 bg-card/30 border-b border-border backdrop-blur-sm">

                {/* Add Story Button / My Story */}
                <div className="flex flex-col items-center gap-2 shrink-0 relative">
                    <button
                        onClick={() => myGroup ? openViewer(0) : setIsCreating(true)}
                        className={`relative w-16 h-16 rounded-full p-[3px] transition-transform active:scale-95 ${myGroup ? (myGroup.has_unseen ? "bg-gradient-to-tr from-primary to-purple-500" : "bg-border") : "bg-secondary"}`}
                    >
                        <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-background flex items-center justify-center">
                            {uploading ? (
                                <Loader2 size={24} className="animate-spin text-muted-foreground" />
                            ) : (
                                <img
                                    src={getAbsUrl(auth.currentUser?.photoURL || "")}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.src = "/assets/default_avatar.png" }}
                                    alt="Me"
                                />
                            )}
                        </div>
                        {!myGroup && (
                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full border-2 border-background flex items-center justify-center text-white">
                                <Plus size={12} />
                            </div>
                        )}
                    </button>
                    <span className="text-xs font-semibold text-foreground/80">Your Story</span>
                </div>

                {/* Other Users' Stories */}
                {otherGroups.map((group, idx) => (
                    <div key={group.user_id} className="flex flex-col items-center gap-2 shrink-0">
                        <button
                            onClick={() => openViewer(myGroup ? idx + 1 : idx)} // Offset index if myGroup exists at 0
                            className={`w-16 h-16 rounded-full p-[3px] transition-transform active:scale-95 ${group.has_unseen ? "bg-gradient-to-tr from-primary to-purple-500" : "bg-border"}`}
                        >
                            <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-background">
                                <img
                                    src={getAbsUrl(group.user_pic)}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.src = "/assets/default_avatar.png" }}
                                    alt={group.user_name}
                                />
                            </div>
                        </button>
                        <span className="text-xs font-semibold text-foreground/80 truncate w-16 text-center">{group.user_name}</span>
                    </div>
                ))}
            </div>

            {/* Hidden file input for creating story */}
            {isCreating && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="glass-card p-6 rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 relative">
                        <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white"><X size={20} /></button>
                        <h3 className="text-xl font-bold mb-6 text-white text-center">Create a Story</h3>

                        <label className="w-full aspect-[9/16] bg-secondary/50 rounded-2xl border-2 border-dashed border-primary/50 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary transition-colors group">
                            <Camera size={48} className="text-primary/50 group-hover:text-primary transition-colors mb-4" />
                            <span className="font-bold text-primary">Upload Photo/Video</span>
                            <span className="text-xs text-muted-foreground mt-2">Max 5MB • Expires in 24h</span>
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleCreateStory} />
                        </label>
                    </div>
                </div>
            )}

            {/* Story Viewer Overlay */}
            <AnimatePresence>
                {viewerOpen && (
                    <StoryViewer
                        groups={viewerGroups}
                        initialGroupIndex={viewerInitialGroupIndex}
                        onClose={() => { setViewerOpen(false); fetchStories(); }}
                        onStoryViewed={handleStoryViewed}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ================= StoryViewer Subcomponent =================
interface StoryViewerProps {
    groups: StoryGroup[];
    initialGroupIndex: number;
    onClose: () => void;
    onStoryViewed: (storyId: string) => void;
}

function StoryViewer({ groups, initialGroupIndex, onClose, onStoryViewed }: StoryViewerProps) {
    const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);

    const currentGroup = groups[groupIndex];
    // Moved conditional return after hooks to follow React rules

    const currentStory = currentGroup.stories[storyIndex];

    const nextStory = () => {
        if (storyIndex < currentGroup.stories.length - 1) {
            setStoryIndex(s => s + 1);
            setProgress(0);
        } else if (groupIndex < groups.length - 1) {
            setGroupIndex(g => g + 1);
            setStoryIndex(0);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const prevStory = () => {
        if (storyIndex > 0) {
            setStoryIndex(s => s - 1);
            setProgress(0);
        } else if (groupIndex > 0) {
            setGroupIndex(g => g - 1);
            setStoryIndex(groups[groupIndex - 1].stories.length - 1);
            setProgress(0);
        }
    };

    // Progress Bar Timer
    useEffect(() => {
        if (paused || !currentStory) return;

        onStoryViewed(currentStory.id);

        const duration = 5000; // 5 seconds per story
        const interval = 50;
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress(p => {
                if (p + step >= 100) {
                    clearInterval(timer);
                    nextStory();
                    return 100;
                }
                return p + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [currentStory, paused, groupIndex, storyIndex, onStoryViewed, nextStory]);

    if (!currentGroup || !currentStory) {
        if (!currentGroup && typeof window !== 'undefined') onClose();
        return null; // Don't render if index is bad
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center touch-none backdrop-blur-xl"
        >
            <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-[2.5rem] overflow-hidden bg-gray-900 shadow-2xl flex flex-col">

                {/* Progress Bars */}
                <div className="absolute top-0 left-0 right-0 flex gap-1 p-4 z-20 bg-gradient-to-b from-black/80 to-transparent pt-6 pointer-events-none">
                    {currentGroup.stories.map((story, idx) => (
                        <div key={story.id} className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-75"
                                style={{
                                    width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header (User Info) */}
                <div className="absolute top-10 left-0 right-0 flex items-center justify-between px-4 z-20">
                    <div className="flex items-center gap-3">
                        <img
                            src={getAbsUrl(currentGroup.user_pic)}
                            className="w-10 h-10 rounded-full border border-white/20 object-cover"
                            alt={currentGroup.user_name}
                            onError={(e) => { e.currentTarget.src = "/assets/default_avatar.png" }}
                        />
                        <div>
                            <span className="text-white font-bold block shadow-black/50 drop-shadow-md">{currentGroup.user_name}</span>
                            <span className="text-white/70 text-xs shadow-black/50 drop-shadow-md">
                                {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setPaused(!paused)} className="text-white drop-shadow-md p-2 hover:bg-white/10 rounded-full transition-colors z-30">
                            {paused ? <Play size={24} className="fill-white" /> : <div className="flex gap-1"><div className="w-1.5 h-4 bg-white rounded-full" /><div className="w-1.5 h-4 bg-white rounded-full" /></div>}
                        </button>
                        <button onClick={onClose} className="text-white drop-shadow-md p-2 hover:bg-white/10 rounded-full transition-colors z-30"><X size={28} /></button>
                    </div>
                </div>

                {/* Image/Content Container */}
                <div
                    className="flex-1 relative flex items-center justify-center bg-black cursor-pointer"
                    style={currentStory.background_color ? { backgroundColor: currentStory.background_color } : {}}
                    onPointerDown={() => setPaused(true)}
                    onPointerUp={() => setPaused(false)}
                    onPointerLeave={() => setPaused(false)}
                >
                    {currentStory.image_url ? (
                        <img
                            src={getAbsUrl(currentStory.image_url)}
                            className="w-full h-full object-contain"
                            alt="Story content"
                            draggable="false"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-8 select-none">
                            <p className="text-white text-2xl font-bold text-center drop-shadow-xl">{currentStory.content}</p>
                        </div>
                    )}
                </div>

                {/* Tap Zones */}
                <div className="absolute inset-0 top-20 z-10 flex cursor-pointer">
                    <div className="w-1/3 h-full" onClick={(e) => { e.stopPropagation(); prevStory(); }} />
                    <div className="w-2/3 h-full" onClick={(e) => { e.stopPropagation(); nextStory(); }} />
                </div>

                {/* Reply Bar */}
                <div className="absolute bottom-6 left-0 right-0 px-4 z-20 flex gap-3 pointer-events-none">
                    <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-4 py-3 flex items-center text-white/50 text-sm">
                        Reply to {currentGroup.user_name}...
                    </div>
                    <button className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white p-2.5 pointer-events-auto hover:scale-110 transition-transform">
                        ❤️
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
