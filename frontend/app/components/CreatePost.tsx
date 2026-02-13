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
        minHeight: "120px"
    }), []);

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card-simple p-6 mb-6 hover:shadow-md transition-shadow"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-border flex-shrink-0">
                    <Image
                        src={isAnonymous ? getAbsUrl("/assets/anonymous.png") : (userPhoto || "/assets/default-user.png")}
                        fill
                        className="object-cover"
                        alt="User"
                        sizes="40px"
                    />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground">Create Post</h3>
                    <p className="text-xs text-muted-foreground">Share your insights with the community</p>
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
            <div className="mb-4">
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
                <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Collaborators</p>
                    <div className="flex flex-wrap gap-2">
                        {collaborators.map((c, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg border border-primary/20">
                                @{c}
                                <button onClick={() => removeCollaborator(c)} className="hover:text-destructive transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Collaborator Input */}
            <div className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={collaboratorInput}
                        onChange={(e) => setCollaboratorInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCollaborator()}
                        placeholder="Add collaborator (username)"
                        className="flex-1 input-field text-sm"
                    />
                    <button
                        onClick={addCollaborator}
                        disabled={!collaboratorInput.trim()}
                        className="btn-secondary text-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                    {/* Image Upload */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="btn-icon"
                        title="Upload image"
                    >
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Anonymous Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            Post Anonymously
                        </span>
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSaveDraft}
                        disabled={loading || !content.trim()}
                        className="btn-ghost text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !content.trim()}
                        className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 size={14} className="animate-spin" />
                                Posting...
                            </span>
                        ) : (
                            "Post"
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default memo(CreatePost);
