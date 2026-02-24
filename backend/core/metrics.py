from prometheus_client import Counter, Histogram

# AI Token Usage
AI_TOKEN_USAGE = Counter(
    "ai_token_usage_total",
    "Total tokens consumed by AI models",
    ["model", "type"] # type: prompt, candidate
)

# Agent Latency
AGENT_LATENCY = Histogram(
    "agent_request_duration_seconds",
    "Latency of AI agent requests in seconds",
    ["agent_name"],
    buckets=(1, 2, 5, 10, 30, 60, 120, 300)
)

# Estimated Cost (USD)
# Gemini 2.0 Flash: $0.10 / 1M tokens (input), $0.40 / 1M tokens (output)
AI_COST_ESTIMATED = Counter(
    "ai_cost_estimated_total",
    "Estimated cost of AI usage in USD",
    ["model"]
)

def record_gemini_usage(model: str, prompt_tokens: int, candidate_tokens: int):
    """
    Records token usage and estimates cost for Gemini 2.0 Flash.
    """
    AI_TOKEN_USAGE.labels(model=model, type="prompt").inc(prompt_tokens)
    AI_TOKEN_USAGE.labels(model=model, type="candidate").inc(candidate_tokens)
    
    # Simple cost estimation logic
    input_cost = (prompt_tokens / 1_000_000) * 0.10
    output_cost = (candidate_tokens / 1_000_000) * 0.40
    AI_COST_ESTIMATED.labels(model=model).inc(input_cost + output_cost)
