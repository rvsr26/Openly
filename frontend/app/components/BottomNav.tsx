"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [showCreateMenu, setShowCreateMenu] = useState(false);

    // Don't show on desktop or certain pages
    const shouldShow = typeof window !== 'undefined' && window.innerWidth < 768;
    const hiddenPaths = ['/login', '/signup'];

    if (!shouldShow || hiddenPaths.some(path => pathname.startsWith(path))) {
        return null;
    }

    const navItems = [
        { icon: Home, label: 'Home', path: '/', active: pathname === '/' },
        { icon: Search, label: 'Search', path: '/search', active: pathname.startsWith('/search') },
        { icon: PlusCircle, label: 'Create', path: '/create', active: false, isCreate: true },
        { icon: Bell, label: 'Notifications', path: '/notifications', active: pathname.startsWith('/notifications') },
        { icon: User, label: 'Profile', path: '/profile', active: pathname.startsWith('/profile') || pathname.startsWith('/u/') },
    ];

    const handleNavigation = (path: string, isCreate: boolean = false) => {
        if (isCreate) {
            // Scroll to top and focus create post
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                const createButton = document.querySelector('[data-create-post]') as HTMLElement;
                createButton?.click();
            }, 300);
        } else {
            router.push(path);
        }
    };

    return (
        <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border safe-area-bottom"
        >
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path, item.isCreate)}
                            className="relative flex flex-col items-center justify-center flex-1 h-full group"
                        >
                            {/* Icon */}
                            <div className={`relative ${item.active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>
                                <Icon className={`w-6 h-6 ${item.isCreate ? 'scale-110' : ''}`} />

                                {/* Active Indicator */}
                                {item.active && (
                                    <motion.div
                                        layoutId="bottomNavActive"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                                    />
                                )}
                            </div>

                            {/* Label */}
                            <span className={`text-[10px] font-medium mt-1 ${item.active ? 'text-primary' : 'text-muted-foreground'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </motion.nav>
    );
}
