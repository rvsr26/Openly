"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/app/lib/api";

type SystemContextType = {
    maintenanceMode: boolean;
    broadcastMessage: string;
    readOnlyMode: boolean;
    pauseRegistrations: boolean;
    disableDms: boolean;
    requireVerifiedEmail: boolean;
    refreshSettings: () => Promise<void>;
};

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [readOnlyMode, setReadOnlyMode] = useState(false);
    const [pauseRegistrations, setPauseRegistrations] = useState(false);
    const [disableDms, setDisableDms] = useState(false);
    const [requireVerifiedEmail, setRequireVerifiedEmail] = useState(false);

    const refreshSettings = async () => {
        try {
            const res = await api.get("/api/v1/system/settings");
            setMaintenanceMode(res.data.maintenance_mode);
            setBroadcastMessage(res.data.broadcast_message);
            setReadOnlyMode(res.data.read_only_mode);
            setPauseRegistrations(res.data.pause_registrations);
            setDisableDms(res.data.disable_dms);
            setRequireVerifiedEmail(res.data.require_verified_email);
        } catch (err) {
            console.error("Failed to load system settings", err);
        }
    };

    useEffect(() => {
        // Initial fetch
        setTimeout(refreshSettings, 0);
        // Refresh settings every 1 minute
        const interval = setInterval(refreshSettings, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <SystemContext.Provider value={{
            maintenanceMode,
            broadcastMessage,
            readOnlyMode,
            pauseRegistrations,
            disableDms,
            requireVerifiedEmail,
            refreshSettings
        }}>
            {children}
        </SystemContext.Provider>
    );
}

export function useSystem() {
    const context = useContext(SystemContext);
    if (context === undefined) {
        throw new Error("useSystem must be used within a SystemProvider");
    }
    return context;
}
