"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "../../lib/api";
import { Post } from "../../types";
import PostItem from "../../components/PostItem";
import { ArrowLeft, Layers } from "lucide-react";

export default function PostPage() {
    const { id } = useParams();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    useEffect(() => {
        const fetchPostAndRelated = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // Fetch the main post
                const res = await api.get(`/posts/${id}`);
                setPost(res.data);

                // Fetch related posts
                setLoadingRelated(true);
                const relatedRes = await api.get(`/posts/${id}/related?limit=3`);
                setRelatedPosts(relatedRes.data);
            } catch (err) {
                console.error("Failed to fetch post or related", err);
                setError("Post not found");
            } finally {
                setLoading(false);
                setLoadingRelated(false);
            }
        };

        fetchPostAndRelated();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="animate-pulse text-primary font-bold">Loading...</div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
                    <h2 className="text-2xl font-bold text-muted-foreground">{error || "Post not found"}</h2>
                    <Link href="/" className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">

            <main className="mt-28 max-w-2xl mx-auto px-4 pb-20">
                <Link href="/feed" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-6 transition font-medium">
                    <ArrowLeft size={16} />
                    Back to Feed
                </Link>

                <PostItem post={post} />

                {/* People Also Read Section */}
                <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <Layers size={18} />
                        </div>
                        <h3 className="text-xl font-black text-foreground">People Also Read</h3>
                    </div>

                    {loadingRelated ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : relatedPosts.length > 0 ? (
                        <div className="space-y-4">
                            {relatedPosts.map((relatedPost) => (
                                <PostItem key={relatedPost.id} post={relatedPost} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 glass-card rounded-2xl text-muted-foreground font-medium">
                            No related posts found at this time.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
