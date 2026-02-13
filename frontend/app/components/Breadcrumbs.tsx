"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href: string;
}

export default function Breadcrumbs() {
    const pathname = usePathname();

    // Don't show on home page or auth pages
    if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
        return null;
    }

    const generateBreadcrumbs = (): BreadcrumbItem[] => {
        const segments = pathname.split('/').filter(Boolean);
        const breadcrumbs: BreadcrumbItem[] = [
            { label: 'Home', href: '/' }
        ];

        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += `/${segment}`;

            // Format label
            let label = segment
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());

            // Special cases
            if (segment === 'u') {
                label = 'User';
            } else if (segment === 'p') {
                label = 'Post';
            } else if (segment.startsWith('@')) {
                label = segment;
            }

            breadcrumbs.push({
                label,
                href: currentPath,
            });
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    if (breadcrumbs.length <= 1) {
        return null;
    }

    return (
        <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                    <div key={crumb.href} className="flex items-center gap-2">
                        {index === 0 ? (
                            <Link
                                href={crumb.href}
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">{crumb.label}</span>
                            </Link>
                        ) : (
                            <>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                {isLast ? (
                                    <span className="text-foreground font-medium truncate max-w-[200px]">
                                        {crumb.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={crumb.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
                                    >
                                        {crumb.label}
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
