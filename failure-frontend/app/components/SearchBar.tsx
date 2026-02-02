import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResult } from '../types';
import api, { getAbsUrl } from '../lib/api';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter(); // Initialize Router

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      try {
        const res = await api.get(`/search/?q=${query}`);
        setResults(res.data);
      } catch (error) {
        console.error("Search failed", error);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // HANDLE NAVIGATION
  const handleSelect = (item: SearchResult) => {
    if (item.type === 'user') {
      // Go to User Profile
      router.push(`/profile/${item.id}`);
    } else {
      // Go to Post
      console.log("Go to post:", item.id);
    }
    setResults([]); // Close dropdown
    setQuery('');   // Clear search
  };

  return (
    <div className="relative w-full max-w-md mx-auto z-50">
      {/* Input Field */}
      <div className="relative group">
        <input
          type="text"
          className="w-full px-4 py-2.5 pl-10 bg-secondary/50 border border-transparent rounded-full focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground text-foreground"
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
        <div className="absolute mt-2 w-full glass-card rounded-xl overflow-hidden max-h-96 overflow-y-auto animate-accordion-down z-50">
          {results.map((item: SearchResult) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="p-3 hover:bg-secondary/80 cursor-pointer border-b border-border/50 flex gap-3 items-center transition-colors"
            >
              <img
                src={getAbsUrl(item.user_pic)}
                alt={item.username || "User"}
                className="w-8 h-8 rounded-full object-cover border border-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                  {/* Show distinct label for Users vs Posts */}
                  {item.type === 'user' ? (
                    <span className="text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">USER</span>
                  ) : (
                    <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">POST</span>
                  )}
                  <span className="truncate">{item.username || item.display_name}</span>
                </p>
                {/* Only show content preview for posts */}
                {item.type === 'post' && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}