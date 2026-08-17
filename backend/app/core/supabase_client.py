from supabase import create_client, Client
from app.core.config import settings

# Use the service_role key (not anon key) since the backend needs
# unrestricted read/write/delete on the bucket, bypassing RLS.
# Never expose this key to the frontend.
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

SUPABASE_BUCKET = settings.SUPABASE_BUCKET