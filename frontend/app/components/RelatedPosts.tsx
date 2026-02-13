"use client";

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import PostItem from './PostItem';
import { Post } from '../types';
import api from '../lib/api';
import PostSkeleton from './PostSkeleton';

interface RelatedPostsProps {
    currentPostId: string;
    tags?: string[];
    category?: string;
}

export default function RelatedPosts({ currentPostId, tags, category }: RelatedPostsProps) {
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRelatedPosts();
    }, [currentPostId, tags, category]);

    const fetchRelatedPosts = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual recommendation API
            // const res = await api.get(`/posts/${currentPostId}/related`);
            // setRelatedPosts(res.data);

            // For now, fetch recent posts from same category
            if (category) {
                const res = await api.get(`/feed/?category=${category}&limit=3`);
                const filtered = res.data.filter((p: Post) => p.id !== currentPostId).slice(0, 3);
                setRelatedPosts(filtered);
            }
        } catch (error) {
            console.error('Failed to fetch related posts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card-simple p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">You Might Also Like</h3>
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <PostSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (relatedPosts.length === 0) {
        return null;
    }

    return (
        <div className="card-simple p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">You Might Also Like</h3>
            </div>

            {/* Related Posts */}
            <div className="space-y-3">
                {relatedPosts.map((post) => (
                    <div key={post.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                        <PostItem post={post} />
                    </div>
                ))}
            </div>
        </div>
    );
}
