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

  const supabase = serviceClient();

  const { data, error } = await supabase
    .from("result_audit_log")
    .select(`
      id,
      match_id,
      changed_by,
      source,
      previous_home,
      previous_away,
      new_home,
      new_away,
      changed_at,
      matches(
        id,
        match_number,
        scheduled_at,
        home_team:teams!home_team_id(code),
        away_team:teams!away_team_id(code)
      )
    `)
    .order("changed_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[GET /api/admin/audit/results]", error);
    return NextResponse.json({ error: "Error al cargar el audit log." }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
