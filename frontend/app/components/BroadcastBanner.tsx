"use client";

import { AlertCircle, X } from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { useState, useEffect } from "react";

export default function BroadcastBanner() {
    const { broadcastMessage } = useSystem();
    const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

    const isVisible = !!(broadcastMessage && broadcastMessage.trim() !== "" && broadcastMessage !== dismissedMessage);

    if (!isVisible) return null;

    return (
        <div className="bg-primary/95 backdrop-blur-sm text-primary-foreground px-4 py-3 shadow-lg flex items-center justify-between z-50 relative animate-in slide-in-from-top-full duration-300">
            <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
                <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                <p className="text-sm font-medium tracking-wide">
                    <strong className="font-bold mr-2">SYSTEM BROADCAST:</strong>
                    {broadcastMessage}
                </p>
            </div>
            <button
                onClick={() => setDismissedMessage(broadcastMessage)}
                className="p-1 hover:bg-black/10 rounded-full transition-colors flex-shrink-0 ml-4"
                aria-label="Dismiss banner"
            >
                <X size={16} />
            </button>
        </div>
    );
}
