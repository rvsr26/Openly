import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import Router

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Initialize Router

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/search/?q=${query}`);
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // HANDLE NAVIGATION
  const handleSelect = (item: any) => {
    if (item.type === 'user') {
      // Go to User Profile (You need to create this page: /app/profile/[id]/page.tsx)
      router.push(`/profile/${item.id}`); 
    } else {
      // Go to Post (or just stay on feed and filter)
      console.log("Go to post:", item.id);
    }
    setResults([]); // Close dropdown
    setQuery('');   // Clear search
  };

  return (
    <div className="relative w-full max-w-md mx-auto z-50 text-gray-800">
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-2 pl-10 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:border-blue-500 outline-none transition-all"
          placeholder="Search people or stories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {/* Search Icon SVG ... */}
      </div>

      {/* Dropdown Results */}
      {(results.length > 0) && (
        <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-96 overflow-y-auto">
          {results.map((item: any) => (
            <div 
              key={item.id} 
              onClick={() => handleSelect(item)} // <--- CLICK HANDLER
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex gap-3 items-center"
            >
              <img 
                src={item.user_pic || "/assets/default_avatar.png"} 
                className="w-8 h-8 rounded-full object-cover" 
              />
              <div>
                <p className="text-sm font-semibold">
                  {/* Show distinct label for Users vs Posts */}
                  {item.type === 'user' ? (
                     <span className="text-blue-600 mr-2">@</span>
                  ) : (
                     <span className="text-gray-400 text-xs uppercase mr-2">POST</span>
                  )}
                  {item.username || item.display_name}
                </p>
                {/* Only show content preview for posts */}
                {item.type === 'post' && (
                    <p className="text-xs text-gray-500 line-clamp-1">{item.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}