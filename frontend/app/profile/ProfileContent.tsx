"use client";

import { motion, AnimatePresence } from "framer-motion";
import PostItem from "../components/PostItem";
import { Post } from "../types";
import { Grid, Image as ImageIcon, Bookmark } from "lucide-react";

interface ProfileContentProps {
    activeTab: string;
    posts: Post[];
    user: any;
}

export default function ProfileContent({ activeTab, posts, user }: ProfileContentProps) {

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
