"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, User, FileText, Command, Zap } from "lucide-react";

const steps = [
    {
        title: "Welcome to Openly",
        description: "A safe space for open insights, career advice, and meaningful connections. Let's get you oriented!",
        icon: Sparkles,
        color: "text-amber-400"
    },
    {
        title: "Discover Content",
        description: "Browse the Feed, see what's Trending, or get personalized recommendations in 'For You'.",
        icon: Zap,
        color: "text-blue-400"
    },
    {
        title: "Many Personas, One You",
        description: "Use our Alias system to switch identities. Post as a professional, a mentor, or stay completely Anonymous.",
        icon: User,
        color: "text-emerald-400"
    },
    {
        title: "Markdown Power",
        description: "Create rich posts with Markdown. Add images, tags, and even content warnings for sensitive topics.",
        icon: FileText,
        color: "text-purple-400"
    },
    {
        title: "Speedy Navigation",
        description: "Press Ctrl+K (or Cmd+K) anywhere to open the Command Palette and navigate like a pro.",
        icon: Command,
        color: "text-primary"
    }
];

export default function OnboardingGuide() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasCompleted = localStorage.getItem("openly_onboarding_completed");
        if (!hasCompleted) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleComplete = () => {
        localStorage.setItem("openly_onboarding_completed", "true");
        setIsVisible(false);
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (!isVisible) return null;

    const StepIcon = steps[currentStep].icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-card border border-border/50 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden relative"
                >
                    {/* Close Button */}
                    <button
                        onClick={handleComplete}
                        className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Progress Bar */}
                    <div className="flex h-1 gap-1">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 transition-all duration-500 ${i <= currentStep ? "bg-primary" : "bg-muted"}`}
                            />
                        ))}
                    </div>

                    <div className="p-10 text-center">
                        {/* Icon */}
                        <motion.div
                            key={currentStep}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-8 shadow-inner`}
                        >
                            <StepIcon size={40} className={steps[currentStep].color} />
                        </motion.div>

                        <motion.h3
                            key={`title-${currentStep}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-2xl font-black text-foreground mb-4"
                        >
                            {steps[currentStep].title}
                        </motion.h3>

                        <motion.p
                            key={`desc-${currentStep}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-muted-foreground leading-relaxed font-medium"
                        >
                            {steps[currentStep].description}
                        </motion.p>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 border-t border-border/30 bg-muted/20 flex items-center justify-between">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-2 text-sm font-bold transition-all ${currentStep === 0 ? "opacity-0 invisible" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <ChevronLeft size={18} />
                            Back
                        </button>

                        <div className="flex gap-4">
                            {currentStep < steps.length - 1 && (
                                <button
                                    onClick={handleComplete}
                                    className="text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
                                >
                                    Skip
                                </button>
                            )}
                            <button
                                onClick={nextStep}
                                className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                            >
                                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
