from flask_caching import Cache

# Redis caching configuration
config = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_REDIS_URL": "redis://localhost:6379/3",  # Use DB 3 to avoid conflicts
    "CACHE_DEFAULT_TIMEOUT": 60  # 1 minute default timeout (reduced for more responsive updates)
}

cache = Cache(config=config)

def clear_parking_cache():
    """Clear parking-related cache entries efficiently"""
    # Use cache.clear() to clear all cache entries - simple and effective
    cache.clear()
    
def clear_all_parking_cache():
    """Clear all parking-related cache entries"""
    # Clear all cache entries to ensure fresh data
    cache.clear()
    # Could add other parking-related cache keys here if needed 