"use client";

import Navbar from "../components/Navbar";
import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="pt-32 max-w-md mx-auto px-4 text-center">
                <div className="inline-flex p-6 bg-primary/10 rounded-3xl text-primary mb-6">
                    <Settings size={48} />
                </div>
                <h1 className="text-3xl font-bold mb-4">Settings</h1>
                <p className="text-muted-foreground mb-8">
                    Manage your account preferences. This feature is coming soon in the next update.
                </p>
            </main>
        </div>
    );
}
