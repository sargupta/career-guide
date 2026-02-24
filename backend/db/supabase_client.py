"""Supabase client singleton."""
from supabase import create_client, Client
from core.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.NEXT_PUBLIC_SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _client


def get_supabase_anon(token: str = None) -> Client:
    """Anon client — respects RLS. Use for user-scoped operations.
    Pass the user's extracted JWT `token` to authenticate the PG session."""
    client = create_client(settings.NEXT_PUBLIC_SUPABASE_URL, settings.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    if token:
        # Pass the JWT so Supabase knows which auth.uid() this request belongs to
        client.postgrest.auth(token)
    return client
