"use client";

export default function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="card-simple p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />

                    <div className="flex-1 space-y-4">
                        {/* Name and username */}
                        <div>
                            <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-muted rounded animate-pulse" />
                            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6">
                            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
                            <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="card-simple p-4">
                <div className="flex gap-4 border-b border-border pb-2">
                    <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="card-simple p-6">
                        <div className="space-y-3">
                            <div className="h-4 w-full bg-muted rounded animate-pulse" />
                            <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
