import os
from flask_caching import Cache

_redis_base = os.environ.get('REDIS_URL', 'redis://localhost:6379')

# Redis caching configuration — DB 3 reserved for cache to avoid conflicts
config = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_REDIS_URL": f"{_redis_base}/3",
    "CACHE_DEFAULT_TIMEOUT": 60
}

cache = Cache(config=config)

def clear_parking_cache():
    """Clear all parking-related cache entries"""
    cache.clear()