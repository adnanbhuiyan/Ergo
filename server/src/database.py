from supabase import create_client, Client
from config import url, key

supabase: Client = create_client(url, key)
