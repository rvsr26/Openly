"use client";

import { motion, AnimatePresence } from "framer-motion";
import PostItem from "../components/PostItem";
import { Post } from "../types";
import { Grid, Image as ImageIcon, Bookmark, Briefcase, GraduationCap, Award, Plus, Map, ArrowRight, ArrowLeft } from "lucide-react";
import TimelineView from "../components/TimelineView";
import { timelineApi, Timeline } from "../lib/timelineApi";

interface ProfileContentProps {
    activeTab: string;
    posts: Post[];
    user: any;
    isOwner?: boolean;
    onRefresh?: () => void;
}

import { useState, useEffect } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { auth } from "../firebase";

export default function ProfileContent({ activeTab, posts, user, isOwner, onRefresh }: ProfileContentProps) {
    const [isAddingExp, setIsAddingExp] = useState(false);
    const [isAddingSkill, setIsAddingSkill] = useState(false);

    // Journey States
    const [timelines, setTimelines] = useState<Timeline[]>([]);
    const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
    const [loadingTimelines, setLoadingTimelines] = useState(false);
    const [isCreatingJourney, setIsCreatingJourney] = useState(false);
    const [newJourney, setNewJourney] = useState({ title: "", description: "" });

    // Form States
    const [newExp, setNewExp] = useState({
        company: "",
        position: "",
        start_date: "",
        end_date: "",
        current: false,
        description: ""
    });
    const [newSkill, setNewSkill] = useState("");

    // Fetch Timelines when tab is active
    useEffect(() => {
        if (activeTab === "Journeys" && user) {
            setTimeout(() => setLoadingTimelines(true), 0);
            timelineApi.getUserTimelines(user.id || user.uid)
                .then(setTimelines)
                .catch(console.error)
                .finally(() => setLoadingTimelines(false));
        }
    }, [activeTab, user]);

    const handleCreateJourney = async () => {
        if (!newJourney.title.trim()) return;
        try {
            const created = await timelineApi.create(newJourney);
            setTimelines([created, ...timelines]);
            setIsCreatingJourney(false);
            setNewJourney({ title: "", description: "" });
            toast.success("Journey started!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to create journey");
        }
    };

    const handleAddExperience = async () => {
        if (!newExp.company || !newExp.position || !newExp.start_date) {
            toast.error("Please fill in required fields");
            return;
        }
        try {
            const updatedExperiences = [...(user.experiences || []), newExp];
            await api.put(`/users/${user.id || user.uid}/professional-info`, {
                experiences: updatedExperiences
            });
            toast.success("Experience added!");
            setIsAddingExp(false);
            setNewExp({ company: "", position: "", start_date: "", end_date: "", current: false, description: "" });
            if (onRefresh) onRefresh();
        } catch (e) {
            toast.error("Failed to add experience");
        }
    };

    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;
        try {
            const updatedSkills = [...(user.skills || []), { name: newSkill.trim(), endorsements: 0 }];
            await api.put(`/users/${user.id || user.uid}/professional-info`, {
                skills: updatedSkills
            });
            toast.success("Skill added!");
            setIsAddingSkill(false);
            setNewSkill("");
            if (onRefresh) onRefresh();
        } catch (e) {
            toast.error("Failed to add skill");
        }
    };

    const handleEndorseSkill = async (skillName: string) => {
        try {
            await api.post(`/users/${user.id || user.uid}/skills/${encodeURIComponent(skillName)}/endorse?endorser_id=${auth.currentUser?.uid}`);
            toast.success("Skill endorsed!");
            if (onRefresh) onRefresh();
        } catch (e: any) {
            if (e.response?.status === 400) {
                toast.error("You cannot endorse your own skill.");
            } else {
                toast.error("Failed to endorse skill.");
            }
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case "Overview":
            case "Posts":
                return (
                    <div className="space-y-6">
                        {posts.length === 0 ? (
                            <EmptyState
                                icon={Grid}
                                title="No Posts Yet"
                                description="Share your journey to inspire others."
                            />
                        ) : (
                            posts.map((post, idx) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <PostItem post={post} />
                                </motion.div>
                            ))
                        )}
                    </div>
                );
            case "Journeys":
                if (selectedTimelineId) {
                    return (
                        <div className="animate-in fade-in slide-in-from-right-8">
                            <button
                                onClick={() => setSelectedTimelineId(null)}
                                className="mb-4 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ArrowLeft size={16} /> Back to Journeys
                            </button>
                            <TimelineView timelineId={selectedTimelineId} />
                        </div>
                    );
                }

                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">My Journeys</h3>
                            {isOwner && !isCreatingJourney && (
                                <button
                                    onClick={() => setIsCreatingJourney(true)}
                                    className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all"
                                >
                                    + New Journey
                                </button>
                            )}
                        </div>

                        {isCreatingJourney && (
                            <div className="glass-card p-6 space-y-4 animate-in fade-in slide-in-from-top-4 mb-6 border border-primary/20">
                                <h4 className="font-bold text-lg">Start a New Journey</h4>
                                <input
                                    placeholder="Journey Title (e.g. My Startup Pivot)"
                                    className="glass-input"
                                    value={newJourney.title}
                                    onChange={e => setNewJourney({ ...newJourney, title: e.target.value })}
                                />
                                <textarea
                                    placeholder="Description (Optional)"
                                    className="glass-input min-h-[80px]"
                                    value={newJourney.description}
                                    onChange={e => setNewJourney({ ...newJourney, description: e.target.value })}
                                />
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsCreatingJourney(false)}
                                        className="px-6 py-2 rounded-xl border border-border text-sm font-bold hover:bg-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateJourney}
                                        disabled={!newJourney.title.trim()}
                                        className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        Create Journey
                                    </button>
                                </div>
                            </div>
                        )}

                        {loadingTimelines ? (
                            <div className="text-center py-12 text-muted-foreground">Loading journeys...</div>
                        ) : timelines.length === 0 && !isCreatingJourney ? (
                            <EmptyState
                                icon={Map}
                                title="No Journeys Started"
                                description="Group your posts into a timeline to show your growth."
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {timelines.map((timeline) => (
                                    <div
                                        key={timeline.id}
                                        onClick={() => setSelectedTimelineId(timeline.id)}
                                        className="glass-card p-6 cursor-pointer hover:border-primary/50 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight className="text-primary" size={20} />
                                        </div>
                                        <h4 className="font-bold text-lg mb-2">{timeline.title}</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{timeline.description || "No description"}</p>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${timeline.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
                                                }`}>
                                                {timeline.status}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {new Date(timeline.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case "Media":
                return (
                    <EmptyState
                        icon={ImageIcon}
                        title="No Media"
                        description="Photos and videos will appear here."
                    />
                );
            case "Saved":
                return (
                    <EmptyState
                        icon={Bookmark}
                        title="Saved Items"
                        description="Posts you bookmark will appear here."
                    />
                );
            case "Education":
                return (
                    <div className="space-y-6">
                        {(user.education && user.education.length > 0) ? (
                            user.education.map((edu: any, idx: number) => (
                                <div key={idx} className="glass-card p-6 flex gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{edu.school}</h4>
                                        <p className="text-sm text-primary font-medium">{edu.degree} {edu.field ? `in ${edu.field}` : ""}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {edu.start_date} - {edu.end_date || "Present"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                icon={GraduationCap}
                                title="Academic Background"
                                description="Share where you learned your craft."
                            />
                        )}
                    </div>
                );
            case "Experience":
                return (
                    <div className="space-y-6">
                        {isOwner && !isAddingExp && (
                            <button
                                onClick={() => setIsAddingExp(true)}
                                className="w-full py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all group"
                            >
                                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold">Add Professional Experience</span>
                            </button>
                        )}

                        {isAddingExp && (
                            <div className="glass-card p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        placeholder="Company *"
                                        className="glass-input"
                                        value={newExp.company}
                                        onChange={e => setNewExp({ ...newExp, company: e.target.value })}
                                    />
                                    <input
                                        placeholder="Position *"
                                        className="glass-input"
                                        value={newExp.position}
                                        onChange={e => setNewExp({ ...newExp, position: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        placeholder="Start Date (e.g. Jan 2020) *"
                                        className="glass-input"
                                        value={newExp.start_date}
                                        onChange={e => setNewExp({ ...newExp, start_date: e.target.value })}
                                    />
                                    <input
                                        placeholder="End Date (or 'Present') *"
                                        className="glass-input"
                                        value={newExp.end_date}
                                        onChange={e => setNewExp({ ...newExp, end_date: e.target.value })}
                                        disabled={newExp.current}
                                    />
                                </div>
                                <textarea
                                    placeholder="Description (Optional)"
                                    className="glass-input min-h-[100px]"
                                    value={newExp.description}
                                    onChange={e => setNewExp({ ...newExp, description: e.target.value })}
                                />
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setIsAddingExp(false)} className="px-6 py-2 rounded-xl border border-border text-sm font-bold">Cancel</button>
                                    <button onClick={handleAddExperience} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Save Experience</button>
                                </div>
                            </div>
                        )}

                        {(user.experiences && user.experiences.length > 0) ? (
                            user.experiences.map((exp: any, idx: number) => (
                                <div key={idx} className="glass-card p-6 flex gap-4 hover:border-primary/30 transition-colors group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                                        <Briefcase size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-foreground text-lg">{exp.position}</h4>
                                        <p className="text-sm text-primary font-bold uppercase tracking-wider">{exp.company}</p>
                                        <p className="text-xs text-muted-foreground mt-1 font-medium bg-white/5 py-1 px-2 rounded-md inline-block">
                                            {exp.start_date} - {exp.current ? "Present" : exp.end_date}
                                        </p>
                                        {exp.description && <p className="text-sm text-muted-foreground/80 mt-4 leading-relaxed">{exp.description}</p>}
                                    </div>
                                </div>
                            ))
                        ) : !isAddingExp && (
                            <EmptyState
                                icon={Briefcase}
                                title="No Experience Added"
                                description="Add your professional journey here."
                            />
                        )}
                    </div>
                );
            case "Skills":
                return (
                    <div className="glass-card p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-black text-xl text-foreground flex items-center gap-3">
                                <Award size={24} className="text-primary" />
                                Professional Skills
                            </h3>
                            {isOwner && (
                                <button
                                    onClick={() => setIsAddingSkill(true)}
                                    className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
                                >
                                    <Plus size={20} />
                                </button>
                            )}
                        </div>

                        {isAddingSkill && (
                            <div className="mb-8 flex gap-3 animate-in fade-in slide-in-from-right-4">
                                <input
                                    autoFocus
                                    placeholder="Enter a skill (e.g. React, Python)..."
                                    className="glass-input flex-1"
                                    value={newSkill}
                                    onChange={e => setNewSkill(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleAddSkill()}
                                />
                                <button onClick={handleAddSkill} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold">Add</button>
                                <button onClick={() => setIsAddingSkill(false)} className="px-4 py-2 bg-white/5 rounded-xl text-sm font-bold">Cancel</button>
                            </div>
                        )}

                        {(user.skills && user.skills.length > 0) ? (
                            <div className="flex flex-wrap gap-4">
                                {user.skills.map((skill: any, idx: number) => {
                                    const hasEndorsed = skill.endorsers?.includes(auth.currentUser?.uid);
                                    return (
                                        <div key={idx} className={`px-5 py-3 ${hasEndorsed ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/10'} border rounded-2xl flex items-center gap-3 hover:border-primary/50 transition-all cursor-default group`}>
                                            <span className="text-sm font-black text-foreground/80 group-hover:text-primary transition-colors">{skill.name}</span>
                                            <div className="h-4 w-[1px] bg-white/10" />
                                            <button
                                                onClick={() => !isOwner && handleEndorseSkill(skill.name)}
                                                disabled={isOwner}
                                                className={`text-[10px] font-black ${hasEndorsed ? 'bg-primary text-white' : 'bg-primary/10 text-primary'} px-2 py-0.5 rounded-full ring-1 ring-primary/20 ${!isOwner && 'hover:scale-110 active:scale-95 transition-transform'}`}
                                            >
                                                {skill.endorsements || 0}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : !isAddingSkill && (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-3xl">
                                <Award size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                                <p className="text-muted-foreground font-bold tracking-tight">No skills highlighted yet.</p>
                                {isOwner && <p className="text-xs text-muted-foreground/60 mt-1">Start by adding your core competencies.</p>}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[400px]"
        >
            {renderContent()}
        </motion.div>
    );
}

function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center glass-card border-dashed border-muted-foreground/20">
            <div className="p-4 bg-muted/50 rounded-full mb-4">
                <Icon size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
