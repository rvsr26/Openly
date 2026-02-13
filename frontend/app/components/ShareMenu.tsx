"use client";

import { useState } from 'react';
import { Share2, Link as LinkIcon, Twitter, Facebook, Linkedin, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ShareMenuProps {
    postId: string;
    postTitle?: string;
    postUrl?: string;
}

export default function ShareMenu({ postId, postTitle = 'Check out this post', postUrl }: ShareMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const url = postUrl || `${window.location.origin}/p/${postId}`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    const shareToTwitter = () => {
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(url)}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const shareToFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const shareToLinkedIn = () => {
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            '_blank',
            'width=550,height=420'
        );
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-icon"
                aria-label="Share"
            >
                <Share2 className="w-4 h-4" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                        >
                            <div className="p-2 space-y-1">
                                {/* Copy Link */}
                                <button
                                    onClick={copyToClipboard}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    <span className="text-sm text-foreground">
                                        {copied ? 'Copied!' : 'Copy link'}
                                    </span>
                                </button>

                                {/* Divider */}
                                <div className="border-t border-border my-1" />

                                {/* Social Media */}
                                <button
                                    onClick={shareToTwitter}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                                >
                                    <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                                    <span className="text-sm text-foreground">Share on Twitter</span>
                                </button>

                                <button
                                    onClick={shareToFacebook}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                                >
                                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                                    <span className="text-sm text-foreground">Share on Facebook</span>
                                </button>

                                <button
                                    onClick={shareToLinkedIn}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                                >
                                    <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                                    <span className="text-sm text-foreground">Share on LinkedIn</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
