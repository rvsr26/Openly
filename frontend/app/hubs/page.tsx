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
                {/* HERO HEADER */}
                <div className="text-center py-12 mb-8">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 border border-primary/20">
                            <Briefcase size={12} /> Industry Hubs
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                            Connect by <span className="text-primary">Industry</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Connect with professionals and students in your specific field through validated insights and discussions.
                        </p>
                    </motion.div>
                </div>

                {/* SEARCH */}
                <div className="flex flex-col sm:flex-row gap-3 mb-10 max-w-2xl mx-auto">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search industries..."
                            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredHubs.map((hub, idx) => (
                        <Link key={hub.name} href={`/hubs/${hub.name.toLowerCase()}`} className="group">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`h-full flex flex-col rounded-[2.5rem] bg-card border ${hub.border} hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 p-2 overflow-hidden`}
                            >
                                <div className={`aspect-[4/3] rounded-[2rem] ${hub.bg} flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-700`}>
                                    <hub.icon className={`${hub.color} group-hover:scale-110 transition-transform duration-500 w-16 h-16`} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                                            {hub.name}
                                        </h3>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-6 flex-1">
                                        {hub.desc}
                                    </p>
                                    
                                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-7 h-7 rounded-full bg-secondary border-2 border-card shadow-sm" />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">
                                            Explore Hub
                                        </span>
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
