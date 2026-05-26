import { createClient as createServerClient } from "./server";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (bearerToken) {
    // Cliente con JWT propagado al contexto RLS de PostgREST
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${bearerToken}` } },
        auth: { persistSession: false },
      }
    );
    const { data: { user }, error } = await supabase.auth.getUser(bearerToken);
    return { user: error ? null : user, supabase };
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}
