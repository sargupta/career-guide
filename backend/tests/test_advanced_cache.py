import sys
import os
import time
import numpy as np
from redis.commands.search.query import Query

# Add current directory to path (assuming run from backend root)
sys.path.append(os.getcwd())

from services.semantic_cache import cache
from core.config import settings

def test_advanced_cache():
    print(f"Testing Advanced Semantic Cache at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    
    q_orig = "Explain Photosynthesis?"
    q_norm = "Tell me about photosynthesis"
    resp = "Photosynthesis is the process by which green plants..."
    
    print("\n1. Testing Normalization and Tiered Matching")
    cache.update_cache(q_orig, resp, level="basic", language="English")
    time.sleep(1) # Indexing
    
    print(f"Checking exact match for: '{q_orig}'")
    start = time.time()
    res1 = cache.get_cached_response(q_orig, level="basic", language="English")
    if res1:
        print(f"✅ Exact HIT in {(time.time()-start)*1000:.2f}ms")
    else:
        print("❌ Exact MISS")

    print(f"\nChecking normalized match for: '{q_norm}'")
    start = time.time()
    res2 = cache.get_cached_response(q_norm, level="basic", language="English")
    if res2:
        print(f"✅ Normalized HIT in {(time.time()-start)*1000:.2f}ms")
    else:
        print("❌ Normalized MISS")

    print("\n2. Testing Metadata Filtering")
    print("Checking 'advanced' level for same query (should miss)...")
    res3 = cache.get_cached_response(q_orig, level="advanced", language="English")
    if not res3:
        print("✅ Correct Metadata MISS (Level mismatch)")
    else:
        print("❌ Incorrect Metadata HIT")

    print("\n3. Testing Document Hashing (Simplified logic)")
    doc_id = "document:abc123hash"
    cache.update_cache(doc_id, "This is a cached document response", level="basic", language="English")
    res4 = cache.get_cached_response(doc_id, level="basic", language="English")
    if res4:
        print("✅ Document Hash Cache HIT")
    else:
        print("❌ Document Hash Cache MISS")

if __name__ == "__main__":
    test_advanced_cache()
