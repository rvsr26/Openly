"use client";

import Image from "next/image";
import { User } from "firebase/auth";
import { motion } from "framer-motion";
import { getAbsUrl, uploadImage } from "../lib/api";
import { timelineApi, Timeline } from "../lib/timelineApi";
import { memo, useRef, useState, useMemo, useEffect } from "react";
import { Image as ImageIcon, X, Loader2, Map, ChevronDown, Sparkles, Trophy, Users, ShieldAlert, CheckCircle2, Wand2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import dynamic from "next/dynamic";
import "easymde/dist/easymde.min.css";
import PollBuilder, { PollCreateData } from "./PollBuilder";
import { useSystem } from "@/context/SystemContext";

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
    isProfessionalInquiry: boolean;
    setIsProfessionalInquiry: (val: boolean) => void;
    selectedHubs: string[];
    setSelectedHubs: (val: string[]) => void;
    pollData: PollCreateData | null;
    setPollData: (data: PollCreateData | null) => void;
    communityId?: string | null;
    setCommunityId?: (val: string | null) => void;
}

const HUBS = ["Technology", "Business", "Medical", "Education", "Legal", "Finance", "Engineering", "Academic"];

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
    setCollaborators,
    isProfessionalInquiry,
    setIsProfessionalInquiry,
    selectedHubs,
    setSelectedHubs,
    pollData,
    setPollData,
    communityId,
    setCommunityId
}: CreatePostProps) {
    const { readOnlyMode, requireVerifiedEmail } = useSystem();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [collaboratorInput, setCollaboratorInput] = useState("");
    const [showHubMenu, setShowHubMenu] = useState(false);

    const toggleHub = (hub: string) => {
        if (selectedHubs.includes(hub)) {
            setSelectedHubs(selectedHubs.filter(h => h !== hub));
        } else {
            setSelectedHubs([...selectedHubs, hub]);
        }
    };

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

    // Community State
    const [showCommunityMenu, setShowCommunityMenu] = useState(false);
    const { data: communitiesData } = useQuery({
        queryKey: ["userCommunities", user?.uid || user?.id],
        queryFn: async () => {
            if (!user) return { communities: [] };
            const res = await api.get(`/api/v1/users/${user.uid || user.id}/communities`);
            return res.data;
        },
        enabled: !!user && !!setCommunityId, // Only fetch if we can actually set it
        staleTime: 60000,
    });
    const myCommunities: any[] = communitiesData?.communities || [];
    const selectedCommunity = myCommunities.find(c => c.id === communityId);

    // Tag Suggestions
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleEnhanceWithAI = async () => {
        if (!content.trim() || isEnhancing) return;
        setIsEnhancing(true);
        try {
            const res = await api.post('/api/v1/ai/enhance-post', {
                content: content,
                title: "" // We don't have a separate title field yet in the UI
            });

            if (res.data.enhanced_content) {
                setContent(res.data.enhanced_content);
                if (res.data.suggested_tags && res.data.suggested_tags.length > 0) {
                    setSuggestedTags(res.data.suggested_tags);
                }
                alert("✨ Post enhanced by Openly AI!");
            }
        } catch (err) {
            console.error("AI Enhancement failed:", err);
            alert("Failed to enhance post. Check your connection or API key.");
        } finally {
            setIsEnhancing(false);
        }
    };

    useEffect(() => {
        if (!content || content.length < 20) {
            setSuggestedTags([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSuggesting(true);
            try {
                const res = await api.get(`/api/v1/posts/suggest-tags?content=${encodeURIComponent(content)}`);
                setSuggestedTags(res.data.tags || []);
            } catch (err) {
                console.error("Failed to suggest tags:", err);
            } finally {
                setIsSuggesting(false);
            }
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [content]);

    const handleAddSuggestedTag = (tag: string) => {
        // Find existing tags in content or just append them?
        // Let's just append them to the end of the content with a #
        if (!content.includes(`#${tag}`)) {
            setContent(content + ` #${tag}`);
        }
    };

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

    // Check if user is restricted
    const isEmailVerified = user?.email_verified === true;
    const isRestrictedByEmail = requireVerifiedEmail && !isEmailVerified;
    const isRestrictedOverall = readOnlyMode || isRestrictedByEmail;
    const isAdmin = user?.role === 'admin' || user?.username === 'admin';
    const canPost = isAdmin || !isRestrictedOverall;

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
            className="premium-card p-6 mb-8 group/card overflow-hidden"
        >
            {/* Global Restriction Overlay/Banner */}
            {!canPost && (
                <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center text-destructive shrink-0">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground">Posting Restricted</h4>
                        <p className="text-sm text-muted-foreground">
                            {readOnlyMode
                                ? "The platform is currently in Read-Only mode. New posts are temporarily disabled."
                                : "You must verify your email address to create new posts."
                            }
                        </p>
                    </div>
                    {isRestrictedByEmail && !readOnlyMode && (
                        <a href="/profile" className="ml-auto btn-primary !py-2 !px-4 !text-xs whitespace-nowrap">
                            Verify Now
                        </a>
                    )}
                </div>
            )}

            <div className={!canPost ? "opacity-40 pointer-events-none grayscale-[0.5] transition-all duration-700" : ""}>
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

                    {/* Community Selector */}
                    {setCommunityId && myCommunities.length > 0 && (
                        <div className="relative ml-2">
                            <button
                                onClick={() => setShowCommunityMenu(!showCommunityMenu)}
                                className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-all ${communityId
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                                    }`}
                            >
                                <Users size={14} />
                                <span className="hidden sm:inline">{selectedCommunity ? selectedCommunity.name : "Select Community"}</span>
                                <ChevronDown size={14} className={`transition-transform ${showCommunityMenu ? "rotate-180" : ""}`} />
                            </button>

                            {showCommunityMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                                >
                                    <div className="p-2 border-b border-border bg-muted/30">
                                        <p className="text-xs font-semibold text-muted-foreground px-2">Post to Community</p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        <button
                                            onClick={() => { setCommunityId(null); setShowCommunityMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors ${!communityId ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                                        >
                                            None (General Feed)
                                        </button>
                                        {myCommunities.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { setCommunityId(c.id); setShowCommunityMenu(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors ${communityId === c.id ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-md overflow-hidden bg-primary/20 flex items-center justify-center shrink-0">
                                                        {c.icon_url ? (
                                                            <img src={c.icon_url} className="w-full h-full object-cover" alt="icon" />
                                                        ) : (
                                                            <span className="text-[9px] font-black text-primary">{c.name.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <span className="truncate">{c.name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Hub Selector */}
                    <div className="relative ml-auto">
                        <button
                            onClick={() => setShowHubMenu(!showHubMenu)}
                            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all ${selectedHubs.length > 0
                                ? "bg-primary text-white shadow-md shadow-primary/20 hover:scale-105 active:scale-95"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                                }`}
                        >
                            <Trophy size={14} />
                            <span className="hidden sm:inline">
                                {selectedHubs.length > 0 ? `${selectedHubs.length} Hub${selectedHubs.length > 1 ? 's' : ''}` : "Select Hubs"}
                            </span>
                            <ChevronDown size={14} className={`transition-transform ${showHubMenu ? "rotate-180" : ""}`} />
                        </button>

                        {showHubMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute right-0 top-full mt-2 w-60 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 p-2"
                            >
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 pb-2 border-b border-border mb-1">Select Hubs (multi)</p>
                                {HUBS.map(hub => (
                                    <button
                                        key={hub}
                                        onClick={() => toggleHub(hub)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition-colors ${selectedHubs.includes(hub)
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "text-foreground font-medium hover:bg-muted"
                                            }`}
                                    >
                                        <span>{hub} Hub</span>
                                        {selectedHubs.includes(hub) && <span className="text-primary">✓</span>}
                                    </button>
                                ))}
                                {selectedHubs.length > 0 && (
                                    <button
                                        onClick={() => setSelectedHubs([])}
                                        className="w-full text-center text-[10px] text-destructive font-bold py-2 mt-1 border-t border-border hover:bg-destructive/5 rounded-b-lg transition-colors"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="mb-6 editor-container">
                    <SimpleMDE
                        value={content}
                        onChange={setContent}
                        options={mdeOptions}
                    />
                </div>

                {/* Poll Builder */}
                <div className="mb-6">
                    <PollBuilder pollData={pollData} setPollData={setPollData} />
                </div>

                {/* Tag Suggestions UI */}
                {suggestedTags.length > 0 && (
                    <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={14} className="text-primary" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">AI Suggested Tags</span>
                            {isSuggesting && <Loader2 size={10} className="animate-spin text-primary/40" />}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {suggestedTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleAddSuggestedTag(tag)}
                                    className="px-3 py-1.5 rounded-xl bg-primary/5 hover:bg-primary/20 border border-primary/10 text-primary text-xs font-bold transition-all active:scale-95"
                                >
                                    + #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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

                        {/* Professional Inquiry Toggle */}
                        <label className="flex items-center gap-3 cursor-pointer group/toggle ml-4">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={isProfessionalInquiry}
                                    onChange={(e) => setIsProfessionalInquiry(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-9 h-5 rounded-full transition-all duration-300 ${isProfessionalInquiry ? "bg-emerald-500" : "bg-muted"}`}>
                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${isProfessionalInquiry ? "translate-x-4" : "translate-x-0"}`} />
                                </div>
                            </div>
                            <span className="text-xs font-bold text-muted-foreground group-hover/toggle:text-foreground transition-colors uppercase tracking-wider flex items-center gap-1.5">
                                <Map size={12} className={isProfessionalInquiry ? "text-emerald-500" : ""} />
                                Professional Inquiry
                            </span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleEnhanceWithAI}
                            disabled={isEnhancing || !content.trim()}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-all duration-300 disabled:opacity-30 group/wand border border-primary/20"
                            title="Enhance with AI"
                        >
                            {isEnhancing ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <Wand2 size={15} className="group-hover/wand:rotate-12 transition-transform" />
                            )}
                            {isEnhancing ? "Enhancing..." : "Magic Wand"}
                        </button>
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
            </div>
        </motion.div>
    );
}

export default memo(CreatePost);
