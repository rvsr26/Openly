"use client";

import { motion } from "framer-motion";
import {
    Code,
    Briefcase,
    Stethoscope,
    GraduationCap,
    Scale,
    BarChart3,
    Cpu,
    BookOpen,
    Search,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const HUBS = [
    { name: "Technology", icon: Code, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", desc: "Software, AI, Hardware, and Digital Innovation" },
    { name: "Business", icon: Briefcase, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", desc: "Startups, Management, and Corporate Strategy" },
    { name: "Medical", icon: Stethoscope, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", desc: "Healthcare, Biotech, and Clinical Insights" },
    { name: "Education", icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", desc: "Teaching, EdTech, and Academic Research" },
    { name: "Legal", icon: Scale, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", desc: "Law, Policy, and Regulatory Discussion" },
    { name: "Finance", icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", desc: "Markets, Fintech, and Personal Finance" },
    { name: "Engineering", icon: Cpu, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", desc: "Civil, Mechanical, and Structural Engineering" },
    { name: "Academic", icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20", desc: "Science, Humanities, and Pure Research" },
];

export default function HubsPage() {
    const [search, setSearch] = useState("");

    const filteredHubs = HUBS.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.desc.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground">

            <main className="pt-28 max-w-6xl mx-auto px-4 pb-24">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <Link href="/feed" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 text-xs font-black uppercase tracking-widest">
                            <ArrowLeft size={14} /> Back to Feed
                        </Link>
                        <h1 className="text-4xl font-black text-foreground">Industry Hubs</h1>
                        <p className="text-muted-foreground mt-2 max-w-md">
                            Connect with professionals and students in your specific field.
                            Validated insights and industry-specific discussions.
                        </p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search industries..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all shadow-2xl"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredHubs.map((hub, idx) => (
                        <Link key={hub.name} href={`/hubs/${hub.name.toLowerCase()}`}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`p-6 rounded-[2rem] bg-white/5 border ${hub.border} hover:bg-white/10 transition-all group cursor-pointer h-full flex flex-col`}
                            >
                                <div className={`w-14 h-14 rounded-2xl ${hub.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <hub.icon className={hub.color} size={28} />
                                </div>
                                <h3 className="text-xl font-black text-foreground mb-2 flex items-center justify-between">
                                    {hub.name}
                                    <ChevronRight className="w-5 h-5 text-muted-foreground/0 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {hub.desc}
                                </p>
                                <div className="mt-auto pt-6 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Explore Hub</span>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-secondary border-2 border-background" />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {filteredHubs.length === 0 && (
                    <div className="py-24 text-center rounded-[3rem] bg-white/5 border border-dashed border-white/10">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-muted-foreground/20" />
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-2">No hubs found</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                            We couldn't find a hub for "{search}". Try another industry or request a new one.
                        </p>
                        <button className="mt-8 px-8 py-3 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform">
                            Request Industry Hub
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
