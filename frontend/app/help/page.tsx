"use client";

import { HelpCircle } from "lucide-react";

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">

            <main className="pt-32 max-w-md mx-auto px-4 text-center">
                <div className="inline-flex p-6 bg-primary/10 rounded-3xl text-primary mb-6">
                    <HelpCircle size={48} />
                </div>
                <h1 className="text-3xl font-bold mb-4">Help Center</h1>
                <p className="text-muted-foreground mb-8">
                    Need assistance? Our support team is setting up the help desk. Check back soon.
                </p>
            </main>
        </div>
    );
}
