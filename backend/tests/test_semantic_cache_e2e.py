import sys
import os
import time
import numpy as np
from redis.commands.search.query import Query

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.semantic_cache import cache
from core.config import settings

def test_cache():
    print(f"Testing Semantic Cache using Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    
    q1 = "how to become a software engineer in India"
    r1 = "To become a software engineer in India, you typically need a B.Tech or B.E. in CS/IT..."
    
    print(f"\n1. Seeding cache with first query: '{q1}'")
    cache.update_cache(q1, r1)
    
    time.sleep(1) # Allow Redis indexing
    
    q2 = "Guide me on becoming a software developer in India"
    print(f"\n2. Testing semantically similar query: '{q2}'")
    
    start = time.time()
    # Mocking get_cached_response logic to see score
    embedding = list(cache.encoder.embed([q2]))[0].astype(np.float32).tobytes()
    q = Query("*=>[KNN 1 @embedding $vec AS score]").sort_by("score").return_fields("query", "response", "score").dialect(2)
    params = {"vec": embedding}
    results = cache.r.ft(cache.index_name).search(q, params)
    
    if results.docs:
        doc = results.docs[0]
        score = float(doc.score)
        similarity = 1 - score
        print(f"DEBUG: Similarity score: {similarity:.4f}")
        
        if similarity >= cache.threshold:
            print(f"✅ SUCCESS: Cache HIT in {(time.time() - start)*1000:.2f}ms")
        else:
            print(f"❌ FAILURE: Cache MISS (threshold is {cache.threshold})")

    q3 = "What is the best way to cook masala chai?"
    print(f"\n3. Testing unrelated query: '{q3}'")
    result = cache.get_cached_response(q3)
    if not result:
        print("✅ SUCCESS: Correct Cache MISS for unrelated topic")
    else:
        print("❌ FAILURE: Unexpected Cache HIT")

if __name__ == "__main__":
    test_cache()
