"""
Redis caching utilities for feed optimization.
Provides functions for caching, retrieving, and invalidating feed data.
"""

import os
import json
import redis.asyncio as redis
from typing import Optional, List, Dict, Any

# Redis client singleton
_redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    """
    Initialize and return Redis async client.
    Creates a singleton connection to Redis server.
    """
    global _redis_client
    
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        _redis_client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True
        )
    
    return _redis_client


def generate_cache_key(sort_by: str, category: str = "All", user_id: Optional[str] = None) -> str:
    """
    Create unique cache keys based on feed parameters.
    
    Args:
        sort_by: Sorting method (hot, top, new, for-you)
        category: Post category filter
        user_id: User ID for personalized feeds
    
    Returns:
        Unique cache key string
    """
    if sort_by == "for-you" and user_id:
        return f"feed:for-you:{user_id}:{category}"
    return f"feed:{sort_by}:{category}"


async def get_cached_feed(cache_key: str) -> Optional[List[Dict[str, Any]]]:
    """
    Retrieve cached feed by key.
    
    Args:
        cache_key: The cache key to retrieve
    
    Returns:
        List of posts if found, None otherwise
    """
    try:
        client = await get_redis_client()
        cached_data = await client.get(cache_key)
        
        if cached_data:
            return json.loads(cached_data)
        return None
    except Exception as e:
        print(f"Cache retrieval error: {e}")
        return None


async def set_cached_feed(cache_key: str, data: List[Dict[str, Any]], ttl: int = 30) -> bool:
    """
    Store feed with configurable TTL.
    
    Args:
        cache_key: The cache key to store under
        data: List of posts to cache
        ttl: Time to live in seconds (default 30s)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        client = await get_redis_client()
        serialized_data = json.dumps(data)
        await client.setex(cache_key, ttl, serialized_data)
        return True
    except Exception as e:
        print(f"Cache storage error: {e}")
        return False


async def invalidate_feed_cache(pattern: str = "feed:*") -> int:
    """
    Clear cache entries matching pattern.
    
    Args:
        pattern: Redis key pattern to match (default "feed:*")
    
    Returns:
        Number of keys deleted
    """
    try:
        client = await get_redis_client()
        keys = []
        
        # Scan for matching keys
        async for key in client.scan_iter(match=pattern):
            keys.append(key)
        
        if keys:
            deleted = await client.delete(*keys)
            return deleted
        return 0
    except Exception as e:
        print(f"Cache invalidation error: {e}")
        return 0


async def invalidate_category_cache(category: str) -> None:
    """
    Invalidate all caches for a specific category.
    
    Args:
        category: The category to invalidate caches for
    """
    # Invalidate specific category
    await invalidate_feed_cache(f"feed:*:{category}")
    
    # Also invalidate "All" category as it includes all posts
    if category != "All":
        await invalidate_feed_cache(f"feed:*:All")
