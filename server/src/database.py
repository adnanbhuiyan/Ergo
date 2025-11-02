from supabase import create_client, Client
from src.config import url, key

supabase: Client = create_client(url, key)
