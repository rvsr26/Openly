"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, Bell, User, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const navItems = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/create-post", icon: PlusCircle, label: "Create", highlight: true },
    { href: "/communities", icon: Users, label: "Groups" },
    { href: "/profile", icon: User, label: "Profile" },
];

export default function MobileNav() {
    const pathname = usePathname();
    const { user } = useAuth();

    if (!user) return null; // only show when logged in

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-white/8 bg-background/90 backdrop-blur-2xl safe-area-bottom">
            <div className="flex items-center justify-around px-2 h-16">
                {navItems.map(({ href, icon: Icon, label, highlight }) => {
                    const active = pathname === href.split("#")[0];
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative group transition-all`}
                        >
                            {highlight ? (
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30 -mt-4"
                                >
                                    <Icon className="w-5 h-5 text-white" />
                                </motion.div>
                            ) : (
                                <>
                                    <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${active ? "bg-primary/10" : "group-hover:bg-white/5"}`}>
                                        <Icon className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                                        {active && (
                                            <motion.div
                                                layoutId="mobile-nav-dot"
                                                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                                            />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
