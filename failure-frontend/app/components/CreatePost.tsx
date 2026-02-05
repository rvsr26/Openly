"use client";

import { User } from "firebase/auth";
import { motion } from "framer-motion";
import { getAbsUrl, uploadImage } from "../lib/api";
import { memo, useRef, useState } from "react";
import { Image as ImageIcon, X, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import "easymde/dist/easymde.min.css";

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), { ssr: false });

interface CreatePostProps {
    user: User | null;
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
    setImageUrl
}: CreatePostProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const mdeOptions = {
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
    };


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
    if (!user) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card mb-8 p-6 !rounded-[2rem] border border-primary/20 bg-primary/[0.02] group/create overflow-hidden"
        >
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-primary opacity-70">Share a Review</h3>
            <div className="space-y-4">
                <div className="flex gap-4">
                    <img
                        src={getAbsUrl(userPhoto || user.photoURL)}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary/10 group-hover/create:rotate-3 transition-all duration-200 shadow-lg"
                        alt="User Profile"
                    />
                    <div className="flex-1 min-w-0">
                        <SimpleMDE
                            value={content}
                            onChange={(val) => setContent(val)}
                            options={mdeOptions as any}
                        />
                    </div>
                </div>

                {/* Image Preview */}
                {imageUrl && (
                    <div className="relative w-full h-48 bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden group/image">
                        <img src={getAbsUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover" />
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
                        <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${isAnonymous ? "bg-primary border-primary rotate-12 shadow-sm" : "border-muted-foreground/30 group-hover/anon:border-primary/50"}`}>
                            {isAnonymous && <span className="text-white text-[10px] font-black">✓</span>}
                        </div>
                        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="hidden" />
                        <span className="font-black uppercase tracking-widest opacity-70 group-hover/anon:opacity-100 transition-all">Post Anonymously</span>
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
                            className="flex-1 sm:flex-none px-6 py-3 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !content.trim()}
                            className="flex-1 sm:flex-none px-8 py-3 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-[0.2em] premium-shadow hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all duration-200"
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
