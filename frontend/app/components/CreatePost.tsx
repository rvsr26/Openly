"use client";

import Image from "next/image";
import { User } from "firebase/auth";
import { motion } from "framer-motion";
import { getAbsUrl, uploadImage } from "../lib/api";
import { timelineApi, Timeline } from "../lib/timelineApi";
import { memo, useRef, useState, useMemo, useEffect } from "react";
import { Image as ImageIcon, X, Loader2, Map, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import "easymde/dist/easymde.min.css";

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), { ssr: false });

interface CreatePostProps {
    user: any | null;
    userPhoto?: string;
    content: string;
    setContent: (val: string) => void;
    isAnonymous: boolean;
    setIsAnonymous: (val: boolean) => void;
    handleSubmit: () => void;
    handleSaveDraft: () => void;
    loading: boolean;
    imageUrl: string;
    setImageUrl: (val: string) => void;
    selectedTimelineId: string | null;
    setSelectedTimelineId: (val: string | null) => void;
    collaborators: string[];
    setCollaborators: (val: string[]) => void;
}

function CreatePost({
    user,
    userPhoto,
    content,
    setContent,
    isAnonymous,
    setIsAnonymous,
    handleSubmit,
    handleSaveDraft,
    loading,
    imageUrl,
    setImageUrl,
    selectedTimelineId,
    setSelectedTimelineId,
    collaborators,
    setCollaborators
}: CreatePostProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [collaboratorInput, setCollaboratorInput] = useState("");

    const addCollaborator = () => {
        if (collaboratorInput.trim() && !collaborators.includes(collaboratorInput.trim())) {
            setCollaborators([...collaborators, collaboratorInput.trim()]);
            setCollaboratorInput("");
        }
    };

    const removeCollaborator = (collab: string) => {
        setCollaborators(collaborators.filter(c => c !== collab));
    };

    // Timeline State
    const [timelines, setTimelines] = useState<Timeline[]>([]);
    const [showTimelineMenu, setShowTimelineMenu] = useState(false);

    useEffect(() => {
        if (user) {
            timelineApi.getUserTimelines(user.uid || user.id)
                .then(t => setTimelines(t.filter(tl => tl.status === 'active')))
                .catch(console.error);
        }
    }, [user]);

    const mdeOptions = useMemo(() => ({
        autofocus: false,
        spellChecker: false,
        placeholder: "Share your thoughts, insights, or experiences...",
        status: false,
        autosave: {
            enabled: false,
            uniqueId: "create-post-editor"
        },
        toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "guide"],
        minHeight: "140px"
    } as any), []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const url = await uploadImage(e.target.files[0]);
                setImageUrl(url);
            } catch (err) {
                console.error("Upload failed", err);
                alert("Failed to upload image");
            } finally {
                setUploading(false);
            }
        }
    };

    if (!user) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-simple p-8 text-center mb-6"
            >
                <h3 className="heading-tertiary mb-2">Join the Community</h3>
                <p className="text-body-sm mb-6 max-w-md mx-auto">Share your insights and experiences to help others.</p>
                <div className="flex gap-3 justify-center">
                    <a href="/login" className="btn-primary">
                        Log In
                    </a>
                    <a href="/signup" className="btn-secondary">
                        Sign Up
                    </a>
                </div>
            </motion.div>
        );
    }

    const selectedTimeline = timelines.find(t => t.id === selectedTimelineId);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1] // Custom quintic ease-out
            }}
            className="premium-card p-6 mb-8 group/card"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-primary/20 flex-shrink-0 transition-transform duration-300 group-hover/card:scale-105">
                    <img
                        src={isAnonymous ? getAbsUrl("/assets/anonymous.png") : getAbsUrl(userPhoto || "/assets/default_avatar.png")}
                        className="object-cover w-11 h-11"
                        onError={(e) => { if (!e.currentTarget.src.includes('default_avatar')) e.currentTarget.src = '/assets/default_avatar.png'; }}
                        alt="User"
                    />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Create Post</h3>
                    <p className="text-xs text-muted-foreground/80 font-medium tracking-wide uppercase">Share your insights</p>
                </div>

                {/* Timeline Selector */}
                {timelines.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowTimelineMenu(!showTimelineMenu)}
                            className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-all ${selectedTimelineId
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                                }`}
                        >
                            <Map size={14} />
                            <span className="hidden sm:inline">{selectedTimeline ? selectedTimeline.title : "Add to Journey"}</span>
                            <ChevronDown size={14} className={`transition-transform ${showTimelineMenu ? "rotate-180" : ""}`} />
                        </button>

                        {showTimelineMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                            >
                                <div className="p-2 border-b border-border bg-muted/30">
                                    <p className="text-xs font-semibold text-muted-foreground px-2">Select Journey</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <button
                                        onClick={() => { setSelectedTimelineId(null); setShowTimelineMenu(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors ${!selectedTimelineId ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                                    >
                                        None (General Post)
                                    </button>
                                    {timelines.map(tl => (
                                        <button
                                            key={tl.id}
                                            onClick={() => { setSelectedTimelineId(tl.id); setShowTimelineMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors ${selectedTimelineId === tl.id ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Map size={14} />
                                                <span className="truncate">{tl.title}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>

            {/* Editor */}
            <div className="mb-6 editor-container">
                <SimpleMDE
                    value={content}
                    onChange={setContent}
                    options={mdeOptions}
                />
            </div>

            {/* Image Preview */}
            {imageUrl && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mb-4 rounded-xl overflow-hidden border border-border group"
                >
                    <Image
                        src={getAbsUrl(imageUrl)}
                        alt="Upload preview"
                        width={0}
                        height={0}
                        sizes="100vw"
                        style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover' }}
                    />
                    <button
                        onClick={() => setImageUrl("")}
                        className="absolute top-2 right-2 p-1.5 bg-destructive/90 hover:bg-destructive text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                        <X size={16} />
                    </button>
                </motion.div>
            )}

            {/* Collaborators */}
            {collaborators.length > 0 && (
                <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3">Collaborators</p>
                    <div className="flex flex-wrap gap-2">
                        {collaborators.map((c, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-background/50 hover:bg-background text-primary text-xs font-semibold rounded-full border border-primary/20 shadow-sm transition-all duration-200 group/collab"
                            >
                                <span className="text-primary/40 group-hover/collab:text-primary transition-colors">@</span> {c}
                                <button
                                    onClick={() => removeCollaborator(c)}
                                    className="hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-destructive/10"
                                >
                                    <X size={12} />
                                </button>
                            </motion.span>
                        ))}
                    </div>
                </div>
            )}

            {/* Collaborator Input */}
            <div className="mb-6">
                <div className="flex gap-2 relative group/input">
                    <input
                        type="text"
                        value={collaboratorInput}
                        onChange={(e) => setCollaboratorInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCollaborator()}
                        placeholder="Add collaborator (username)"
                        className="flex-1 input-field !bg-background/20 !border-border/40 focus:!bg-background/40 focus:!border-primary/30 transition-all duration-300 pl-4 text-[14px]"
                    />
                    <button
                        onClick={addCollaborator}
                        disabled={!collaboratorInput.trim()}
                        className="btn-primary !py-2 !px-5 text-sm disabled:opacity-30 disabled:grayscale transition-all duration-300"
                    >
                        Add
                    </button>
                    <div className="absolute inset-0 -z-10 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                    {/* Image Upload */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-300 border border-transparent hover:border-primary/20 shadow-sm active:scale-95"
                        title="Upload image"
                    >
                        {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Anonymous Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer group/toggle">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-9 h-5 rounded-full transition-all duration-300 ${isAnonymous ? "bg-primary" : "bg-muted"}`}>
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${isAnonymous ? "translate-x-4" : "translate-x-0"}`} />
                            </div>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground group-hover/toggle:text-foreground transition-colors uppercase tracking-wider">
                            Anonymous
                        </span>
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSaveDraft}
                        disabled={loading || !content.trim()}
                        className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-200 disabled:opacity-30 active:scale-95"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !content.trim()}
                        className="btn-primary !py-2.5 !px-8 text-sm shadow-lg shadow-primary/20 active:scale-95 disabled:grayscale disabled:opacity-50 min-w-[100px]"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                Publishing...
                            </span>
                        ) : (
                            "Publish Post"
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default memo(CreatePost);
