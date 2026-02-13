"use client";

import { motion, AnimatePresence } from "framer-motion";

interface MotionWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export default function MotionWrapper({ children, className = "" }: MotionWrapperProps) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
