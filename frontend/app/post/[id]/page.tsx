"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "../../lib/api";
import { Post } from "../../types";
import Navbar from "../../components/Navbar";
import PostItem from "../../components/PostItem";
import { ArrowLeft } from "lucide-react";

export default function PostPage() {
    const { id } = useParams();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPost = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // Assuming GET /posts/{id} returns the post object
                const res = await api.get(`/posts/${id}`);
                setPost(res.data);
            } catch (err) {
                console.error("Failed to fetch post", err);
                setError("Post not found");
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="animate-pulse text-primary font-bold">Loading...</div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
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
            <Navbar />

            <main className="mt-28 max-w-2xl mx-auto px-4 pb-20">
                <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-6 transition font-medium">
                    <ArrowLeft size={16} />
                    Back to Feed
                </Link>

                <PostItem post={post} />
            </main>
        </div>
    );
}
