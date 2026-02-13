"use client";

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "ghost" | "danger";
    className?: string;
}

export default function AnimatedButton({ children, variant = "primary", className, ...props }: AnimatedButtonProps) {
    const baseStyles = "relative px-6 py-3 rounded-2xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted text-muted-foreground hover:text-foreground",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={cn(baseStyles, variants[variant], className)}
            {...(props as any)}
        >
            {children}
        </motion.button>
    );
}
