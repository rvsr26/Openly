"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from "@/context/AuthContext";
import api from "@/app/lib/api";

export function useActivityTracker() {
    const { user } = useAuth();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user) return;

        const sendHeartbeat = async () => {
            // Only send if tab is visible
            if (document.visibilityState === 'visible') {
                try {
                    await api.post('/api/reports/heartbeat', { user_id: user.uid });
                    console.log("💗 Activity heartbeat sent");
                } catch (error) {
                    console.error("Failed to send heartbeat", error);
                }
            }
        };

        // Send immediately on mount/auth
        sendHeartbeat();

        // Set interval for every 60 seconds
        intervalRef.current = setInterval(sendHeartbeat, 60000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user]);
}
