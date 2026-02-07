'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api, { getAbsUrl } from '../lib/api';
import PostItem from '../components/PostItem';
import { Post } from '../types';
import { User, MessageCircle, Search as SearchIcon, Users } from 'lucide-react';
import { motion } from 'framer-motion';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') || 'all'; // 'all', 'posts', 'users'

  // Tab State
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');

  // Sync tab with URL or default to posts
  useEffect(() => {
    if (typeParam === 'users') setActiveTab('users');
    else setActiveTab('posts');
  }, [typeParam]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query) return [];
      const res = await api.get(`/search/?q=${query}`);
      return res.data;
    },
    enabled: !!query,
  });

  const posts = results?.filter((item: any) => item.type === 'post') || [];
  const users = results?.filter((item: any) => item.type === 'user') || [];

  const handleTabChange = (tab: 'posts' | 'users') => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('type', tab);
    router.push(`/search?${params.toString()}`);
  };

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Search Openly</h2>
        <p>Type in the search bar to find people and insights.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">
        Search results for <span className="text-primary">"{query}"</span>
      </h1>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-border/50 pb-1">
        <button
          onClick={() => handleTabChange('posts')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all relative ${activeTab === 'posts'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <MessageCircle size={18} />
          <span>Posts</span>
          <span className="bg-muted px-2 py-0.5 rounded-full text-xs ml-1">{posts.length}</span>
          {activeTab === 'posts' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all relative ${activeTab === 'users'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Users size={18} />
          <span>People</span>
          <span className="bg-muted px-2 py-0.5 rounded-full text-xs ml-1">{users.length}</span>
          {activeTab === 'users' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'posts' && (
            <>
              {posts.length > 0 ? (
                posts.map((post: Post) => <PostItem key={post.id} post={post} />)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No posts found matching "{query}"
                </div>
              )}
            </>
          )}

          {activeTab === 'users' && (
            <>
              {users.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {users.map((user: any) => (
                    <div
                      key={user.id}
                      className="glass-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/users/username/${user.username?.replace('@', '')}`)}
                    >
                      <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0 border border-border group-hover:scale-105 transition-transform">
                        {user.user_pic ? (
                          <img
                            src={getAbsUrl(user.user_pic)}
                            alt={user.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <User size={20} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{user.display_name}</h3>
                        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/messages?user=${user.id}`);
                        }}
                        className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                        title="Send Message"
                      >
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No users found matching "{query}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <Suspense fallback={<div className="text-center pt-20">Loading search...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
