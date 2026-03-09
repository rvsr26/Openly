"use client";

import { useEffect, useState } from 'react';

interface ReadTimeEstimateProps {
    content: string;
    className?: string;
}

const WORDS_PER_MINUTE = 200; // Average reading speed

export default function ReadTimeEstimate({ content, className = '' }: ReadTimeEstimateProps) {
    // Count words directly during render
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const readTime = Math.ceil(words / WORDS_PER_MINUTE);

    if (readTime === 0) return null;

    return (
        <span className={`text-xs text-muted-foreground ${className}`}>
            {readTime} min read
        </span>
    );
}
