from flask_caching import Cache

# Redis caching configuration
config = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_REDIS_URL": "redis://localhost:6379/3",  # Use DB 3 to avoid conflicts
    "CACHE_DEFAULT_TIMEOUT": 60  # 1 minute default timeout (reduced for more responsive updates)
}

cache = Cache(config=config)

def clear_parking_cache():
    """Clear all parking-related cache entries"""
    cache.clear()