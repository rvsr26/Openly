"use client";

import { Wrench, ShieldAlert } from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function MaintenanceScreen({ children }: { children: React.ReactNode }) {
    const { maintenanceMode } = useSystem();
    const { user } = useAuth();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Avoid hydration mismatch by waiting for client
    if (!isClient) {
        return <>{children}</>;
    }

    // If NOT in maintenance mode OR user is an admin -> Render app normally
    if (!maintenanceMode || user?.role === "admin" || user?.username === "admin") {
        return <>{children}</>;
    }

    // Otherwise, lock them out with the maintenance screen
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Decorative Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50 animate-pulse delay-1000" />

            <div className="max-w-md w-full text-center relative z-10 space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="mx-auto w-24 h-24 bg-card border border-border/50 rounded-3xl shadow-xl flex items-center justify-center rotate-12 hover:rotate-0 transition-transform duration-500 cursor-pointer">
                    <Wrench className="w-12 h-12 text-primary animate-bounce delay-75" />
                </div>

                <div className="space-y-3">
                    <h1 className="text-4xl font-black text-foreground tracking-tight">We'll be back soon!</h1>
                    <p className="text-lg text-muted-foreground/80 font-medium leading-relaxed">
                        Openly is currently undergoing scheduled maintenance to upgrade our systems.
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-sm text-muted-foreground shadow-sm inline-block text-left w-full">
                    <div className="flex items-start gap-4">
                        <ShieldAlert className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-foreground mb-1">Why am I seeing this?</p>
                            <p>Our engineers are deploying new features and ensuring platform stability. Check back in a few minutes.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
                        Thank you for your patience
                    </p>
                </div>
            </div>
        </div>
    );
}
