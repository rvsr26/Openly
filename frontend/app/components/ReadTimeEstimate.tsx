"use client";

import { useEffect, useState } from 'react';

interface ReadTimeEstimateProps {
    content: string;
    className?: string;
}

const WORDS_PER_MINUTE = 200; // Average reading speed

export default function ReadTimeEstimate({ content, className = '' }: ReadTimeEstimateProps) {
    const [readTime, setReadTime] = useState(0);

    useEffect(() => {
        // Count words
        const words = content.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / WORDS_PER_MINUTE);
        setReadTime(minutes);
    }, [content]);

    if (readTime === 0) return null;

    return (
        <span className={`text-xs text-muted-foreground ${className}`}>
            {readTime} min read
        </span>
    );
}
