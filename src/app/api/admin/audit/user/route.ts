import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/supabase/auth";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function assertAdmin(request: Request): Promise<boolean> {
  const { user } = await getAuthUser(request);
  if (!user?.email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return allowed.includes(user.email.toLowerCase());
}

export async function GET(request: Request) {
  if (!(await assertAdmin(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ error: "Parámetro q requerido." }, { status: 400 });
  }

  const supabase = serviceClient();

  // Resolve user_id: try UUID format first, then lookup by username
  let userId: string | null = null;

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(q)) {
    userId = q;
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", q)
      .maybeSingle();
    userId = profile?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const { data: logs, error } = await supabase
    .from("prediction_audit_log")
    .select(`
      id,
      prediction_id,
      match_id,
      user_id,
      old_home,
      old_away,
      new_home,
      new_away,
      changed_at,
      matches(id, scheduled_at, home_team:teams!home_team_id(code), away_team:teams!away_team_id(code))
    `)
    .eq("user_id", userId)
    .order("changed_at", { ascending: true });

  if (error) {
    console.error("[GET /api/admin/audit/user]", error);
    return NextResponse.json({ error: "Error al cargar el historial." }, { status: 500 });
  }

  return NextResponse.json({ data: logs ?? [], userId });
}
