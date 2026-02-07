import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResult } from '../types';
import api, { getAbsUrl } from '../lib/api';
import { auth } from '../firebase';
import { User } from 'firebase/auth';
import { MessageCircle } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const [authUser, setAuthUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      try {
        let url = `/search/?q=${query}`;
        if (authUser) {
          url += `&user_id=${authUser.uid}`;
        }
        const res = await api.get(url);
        setResults(res.data);
      } catch (error) {
        console.error("Search failed", error);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query, authUser]);

  // HANDLE NAVIGATION
  const handleSelect = (item: SearchResult) => {
    if (item.type === 'user') {
      router.push(`/profile/${item.id}`);
    } else {
      console.log("Go to post:", item.id);
    }
    setResults([]);
    setQuery('');
  };

  const handleFollow = async (e: React.MouseEvent, targetId: string, isFollowing: boolean) => {
    e.stopPropagation(); // Prevent navigation
    if (!authUser) {
      router.push("/login");
      return;
    }

    try {
      if (isFollowing) {
        await api.delete(`/users/${targetId}/follow?user_id=${authUser.uid}`);
      } else {
        await api.post(`/users/${targetId}/follow`, { user_id: authUser.uid });
      }

      // Optimistic update
      setResults(prev => prev.map(item => {
        if (item.id === targetId) {
          return { ...item, is_following: !isFollowing };
        }
        return item;
      }));
    } catch (error) {
      console.error("Follow action failed", error);
    }
  };

  const handleMessage = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (!authUser) {
      router.push("/login");
      return;
    }
    router.push(`/messages?user=${targetId}`);
    setResults([]);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-md mx-auto z-50">
      {/* Input Field */}
      <div className="relative group">
        <input
          type="text"
          className="w-full px-4 py-2.5 pl-10 bg-secondary/50 border border-transparent rounded-full focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground text-indigo-100"
          placeholder="Search people or stories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="absolute left-3.5 top-2.5 text-muted-foreground group-focus-within:text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </div>
      </div>

      {/* Dropdown Results */}
      {(results.length > 0) && (
        <div className="absolute mt-2 w-full glass-card rounded-xl overflow-hidden max-h-96 overflow-y-auto animate-accordion-down z-50 shadow-2xl border border-white/10 bg-[#1e293b]/95 backdrop-blur-md">
          {results.map((item: SearchResult) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 flex gap-3 items-center transition-colors group"
            >
              <img
                src={getAbsUrl(item.user_pic)}
                alt={item.username || "User"}
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-white/90 truncate flex items-center gap-2">
                    <span className="truncate">{item.display_name || item.username}</span>
                    {item.type === 'user' && item.username && (
                      <span className="text-xs text-white/40 font-normal">{item.username}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {item.type === 'user' && authUser?.uid !== item.id && (
                      <>
                        <button
                          onClick={(e) => handleMessage(e, item.id)}
                          className="p-1.5 rounded-full bg-white/5 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-all border border-purple-500/20"
                          title="Message"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button
                          onClick={(e) => handleFollow(e, item.id, !!item.is_following)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${item.is_following
                            ? "bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-400"
                            : "bg-primary text-white hover:bg-primary/80 shadow-lg shadow-primary/20"
                            }`}
                        >
                          {item.is_following ? "Following" : "Follow"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Only show content preview for posts */}
                {item.type === 'post' && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase font-bold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded">Story</span>
                    <p className="text-xs text-white/50 line-clamp-1">{item.content}</p>
                  </div>
                )}
                {item.type === 'user' && (
                  <p className="text-xs text-white/30 truncate">User Account</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
