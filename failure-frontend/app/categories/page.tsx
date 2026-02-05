"use client";

import Navbar from "../components/Navbar";
import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";

const CATEGORIES = [
    { name: "Career", desc: "Share your career setbacks and growth." },
    { name: "Startup", desc: "Lessons learned from building companies." },
    { name: "Academic", desc: "Research, studies, and learning curves." },
    { name: "Relationship", desc: "Personal growth and interpersonal dynamics." },
    { name: "Health", desc: "Physical and mental health journeys." },
];

export default function CategoriesPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="pt-24 max-w-4xl mx-auto px-4 pb-20">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <Layers size={32} />
                    </div>
                    <h1 className="text-3xl font-bold">Explore Categories</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {CATEGORIES.map((cat) => (
                        <Link
                            href={`/?category=${cat.name}`}
                            key={cat.name}
                            className="glass-card p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition duration-300 group"
                        >
                            <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
                                {cat.name}
                                <ArrowRight size={20} className="text-white/20 group-hover:text-primary transition-colors" />
                            </h2>
                            <p className="text-muted-foreground text-sm">{cat.desc}</p>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
