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
        placeholder: "What's your suggestion? Share a failure, a review, or an insight...",
        status: false,
        autosave: {
            enabled: false,
            uniqueId: "create-post-editor"
        },
        toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "guide"],
        minHeight: "150px"
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
                className="glass-card mb-8 p-10 text-center"
            >
                <h3 className="text-2xl font-black text-foreground mb-3">Join the Community</h3>
                <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">Share your reviews, failures, and insights to help others build better products.</p>
                <div className="flex gap-4 justify-center">
                    <a href="/login" className="btn-primary px-8">
                        Log In
                    </a>
                    <a href="/signup" className="btn-secondary px-8 border border-border">
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
            className="glass-card mb-8 p-6 !rounded-[2rem] border border-primary/20 bg-primary/[0.02] group/create overflow-visible z-30 relative"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-70">Share a Review</h3>

                <div className="flex gap-2">
                    {/* Timeline Selector */}
                    {timelines.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => setShowTimelineMenu(!showTimelineMenu)}
                                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${selectedTimelineId ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                    }`}
                            >
                                <Map size={12} />
                                {selectedTimeline ? selectedTimeline.title : "Add to Journey"}
                                <ChevronDown size={12} className={`transition-transform ${showTimelineMenu ? "rotate-180" : ""}`} />
                            </button>

                            {showTimelineMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 glass-card p-1 shadow-xl z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                    <button
                                        onClick={() => {
                                            setSelectedTimelineId(null);
                                            setShowTimelineMenu(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-white/5 transition-colors text-muted-foreground"
                                    >
                                        None
                                    </button>
                                    {timelines.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                setSelectedTimelineId(t.id);
                                                setShowTimelineMenu(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between ${selectedTimelineId === t.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-white/5"
                                                }`}
                                        >
                                            <span className="truncate">{t.title}</span>
                                            {selectedTimelineId === t.id && <span className="text-primary text-[10px]">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-primary/10 group-hover/create:rotate-3 transition-all duration-200 shadow-lg shrink-0">
                        <Image
                            src={getAbsUrl(userPhoto || user.photoURL) || '/assets/default-user.png'}
                            fill
                            className="object-cover"
                            alt="User Profile"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <SimpleMDE
                            value={content}
                            onChange={(val) => setContent(val)}
                            options={mdeOptions as any}
                        />

                        {/* Collaborators Input */}
                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                            {collaborators.map(c => (
                                <span key={c} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    @{c}
                                    <button onClick={() => removeCollaborator(c)} className="hover:text-red-500"><X size={10} /></button>
                                </span>
                            ))}
                            <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1">
                                <span className="text-muted-foreground text-xs">@</span>
                                <input
                                    className="bg-transparent border-none outline-none text-xs text-foreground w-24 placeholder:text-muted-foreground/50"
                                    placeholder="Collaborator ID"
                                    value={collaboratorInput}
                                    onChange={e => setCollaboratorInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addCollaborator();
                                        }
                                    }}
                                />
                                <button onClick={addCollaborator} disabled={!collaboratorInput} className="text-primary disabled:opacity-50 text-xs font-bold">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Preview */}
                {imageUrl && (
                    <div className="relative w-full h-48 bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden group/image">
                        <Image src={getAbsUrl(imageUrl)} fill alt="Preview" className="object-cover" />
                        <button
                            onClick={() => setImageUrl("")}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                    <div className="w-full h-12 flex items-center justify-center bg-primary/5 rounded-xl">
                        <Loader2 className="animate-spin text-primary mr-2" size={16} />
                        <span className="text-xs font-bold text-primary">Uploading...</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-2">
                    <label className="flex items-center space-x-3 text-muted-foreground text-xs cursor-pointer select-none group/anon hover:text-primary transition-colors">
                        <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${isAnonymous ? "bg-primary border-primary rotate-12 shadow-sm" : "border-border/50 group-hover/anon:border-primary/50"}`}>
                            {isAnonymous && <span className="text-white text-[10px] font-black">✓</span>}
                        </div>
                        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="hidden" />
                        <span className="font-bold uppercase tracking-widest opacity-80 group-hover/anon:opacity-100 transition-all">Post Anonymously</span>
                    </label>

                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || loading}
                            className="p-2 rounded-xl hover:bg-primary/10 text-primary/70 hover:text-primary transition-all"
                            title="Add Image"
                        >
                            <ImageIcon size={20} />
                        </button>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleSaveDraft}
                            disabled={loading || !content.trim()}
                            className="flex-1 sm:flex-none btn-secondary border border-border/50 px-6 py-2.5 text-[10px] uppercase tracking-widest"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !content.trim()}
                            className="flex-1 sm:flex-none btn-primary px-8 py-3 text-[10px] uppercase tracking-[0.2em]"
                        >
                            {loading ? "POSTING..." : "SHARE REVIEW"}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default memo(CreatePost);
