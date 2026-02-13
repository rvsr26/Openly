"use client";

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface ReadProgressBarProps {
    contentRef: React.RefObject<HTMLElement>;
}

export default function ReadProgressBar({ contentRef }: ReadProgressBarProps) {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;

            const element = contentRef.current;
            const rect = element.getBoundingClientRect();
            const elementHeight = element.offsetHeight;
            const viewportHeight = window.innerHeight;

            // Calculate how much of the content has been scrolled
            const scrolled = Math.max(0, -rect.top);
            const totalScrollable = elementHeight - viewportHeight;
            const percentage = Math.min(100, Math.max(0, (scrolled / totalScrollable) * 100));

            setProgress(percentage);
            setIsVisible(rect.top < 0 && rect.bottom > viewportHeight);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial calculation

        return () => window.removeEventListener('scroll', handleScroll);
    }, [contentRef]);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted"
        >
            <motion.div
                className="h-full bg-primary"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
            />
        </motion.div>
    );
}
