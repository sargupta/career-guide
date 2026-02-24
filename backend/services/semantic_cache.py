import numpy as np
from fastembed import TextEmbedding
import redis
from redis.commands.search.field import VectorField, TextField
from redis.commands.search.query import Query
import logging
import hashlib
from core.config import settings

logger = logging.getLogger(__name__)

class SemanticCache:
    def __init__(self):
        self.host = settings.REDIS_HOST
        self.port = settings.REDIS_PORT
        # Note: decode_responses=False because we store binary vectors
        self.r = redis.Redis(host=self.host, port=self.port, decode_responses=False)
        self.encoder = TextEmbedding() # Defaults to BAAI/bge-small-en-v1.5
        self.index_name = "idx:semantic_cache"
        self.vector_dim = 384 # Dimension for bge-small-en-v1.5
        self.threshold = 0.90 # High similarity for cache hits
        
        self._create_index()

    def _create_index(self):
        try:
            self.r.ft(self.index_name).info()
            logger.info(f"Redis index {self.index_name} already exists.")
        except Exception:
            try:
                schema = [
                    TextField("query"),
                    TextField("response"),
                    TextField("level"),
                    TextField("language"),
                    VectorField("embedding", "HNSW", {
                        "TYPE": "FLOAT32",
                        "DIM": self.vector_dim,
                        "DISTANCE_METRIC": "COSINE"
                    })
                ]
                self.r.ft(self.index_name).create_index(schema)
                logger.info(f"Created Redis semantic cache index: {self.index_name}")
            except Exception as e:
                logger.warning(f"Could not create Redis index (maybe RediSearch is missing?): {e}")

    def _normalize_query(self, query: str) -> str:
        """Standardize the query to improve cache hit rates."""
        q = query.lower().strip()
        # Remove common filler phrases from academic queries
        fillers = [
            "tell me about", "explain to me", "what is", "define", 
            "how does", "summarize", "explain", "describe", "give me a summary of"
        ]
        # Sort fillers by length descending to match longest first
        for f in sorted(fillers, key=len, reverse=True):
            if q.startswith(f):
                q = q[len(f):].strip()
        # Remove trailing question marks and punctuation
        import re
        q = re.sub(r'[^\w\s]', '', q)
        return q.strip()

    def get_cached_response(self, query_text: str, level: str = "basic", language: str = "English"):
        try:
            normalized_q = self._normalize_query(query_text)
            
            # Tier 1: Exact Match (Fast MD5 lookup)
            h = hashlib.md5(f"{normalized_q}:{level}:{language}".encode()).hexdigest()
            exact_key = f"cache:exact:{h}"
            exact_res = self.r.hget(exact_key, "response")
            if exact_res:
                logger.info(f"Exact Cache HIT for: {normalized_q}")
                return exact_res.decode('utf-8')

            # Tier 2: Semantic Match (Vector Search)
            embedding = list(self.encoder.embed([query_text]))[0].astype(np.float32).tobytes()
            
            # Filter by level and language using RediSearch dialect
            filter_query = f"@level:{level} @language:{language}"
            q = Query(f"({filter_query})=>[KNN 1 @embedding $vec AS score]") \
                .sort_by("score") \
                .return_fields("query", "response", "score") \
                .dialect(2)
            
            params = {"vec": embedding}
            results = self.r.ft(self.index_name).search(q, params)
            
            if results.docs:
                doc = results.docs[0]
                score = float(doc.score)
                similarity = 1 - score
                
                if similarity >= self.threshold:
                    logger.info(f"Semantic Cache HIT (sim={similarity:.4f}) for: {query_text}")
                    return doc.response.decode('utf-8')
            
            logger.info(f"Semantic Cache MISS for: {query_text}")
            return None
        except Exception as e:
            logger.error(f"Error reading from semantic cache: {e}")
            return None

    def update_cache(self, query_text: str, response_text: str, level: str = "basic", language: str = "English"):
        try:
            normalized_q = self._normalize_query(query_text)
            embedding = list(self.encoder.embed([query_text]))[0].astype(np.float32).tobytes()
            
            # Save to semantic index
            h = hashlib.md5(query_text.encode()).hexdigest()
            semantic_key = f"cache:semantic:{h}"
            
            mapping = {
                "query": query_text,
                "response": response_text,
                "embedding": embedding,
                "level": level,
                "language": language
            }
            
            self.r.hset(semantic_key, mapping=mapping)
            self.r.expire(semantic_key, 60*60*24*7) # 7 Day TTL
            
            # Save to exact match tier
            exact_h = hashlib.md5(f"{normalized_q}:{level}:{language}".encode()).hexdigest()
            exact_key = f"cache:exact:{exact_h}"
            self.r.hset(exact_key, "response", response_text)
            self.r.expire(exact_key, 60*60*24*7)
            
            logger.info(f"Cached tiered response for: {query_text} ({level}/{language})")
        except Exception as e:
            logger.error(f"Error updating semantic cache: {e}")

# Global instance for easy import
cache = SemanticCache()
