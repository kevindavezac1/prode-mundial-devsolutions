import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function assertAdmin(request: Request): Promise<{ ok: boolean; userId?: string }> {
  const { user } = await getAuthUser(request);
  if (!user?.email) return { ok: false };
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  const ok = allowed.includes(user.email.toLowerCase());
  return { ok, userId: ok ? user.id : undefined };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`POST:/api/admin/results:${ip}`, 20))) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  const { ok, userId: adminUserId } = await assertAdmin(request);
  if (!ok) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { match_id, home_score, away_score } = body;

  if (
    typeof match_id !== "number" ||
    !Number.isInteger(match_id) ||
    match_id <= 0 ||
    typeof home_score !== "number" ||
    !Number.isInteger(home_score) ||
    typeof away_score !== "number" ||
    !Number.isInteger(away_score) ||
    home_score < 0 || away_score < 0 ||
    home_score > 20 || away_score > 20
  ) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const supabase = serviceClient();

  const { data: match } = await supabase
    .from("matches")
    .select("home_score, away_score")
    .eq("id", match_id)
    .single();

  if (!match) return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      home_score,
      away_score,
      status: "finished",
      result_updated_at: new Date().toISOString(),
      result_source: "admin",
    })
    .eq("id", match_id);

  if (updateError) return NextResponse.json({ error: "Error al actualizar el resultado." }, { status: 500 });

  await supabase.from("result_audit_log").insert({
    match_id,
    changed_by: adminUserId,
    source: "admin",
    previous_home: match.home_score ?? null,
    previous_away: match.away_score ?? null,
    new_home: home_score,
    new_away: away_score,
  });

  const { data: count } = await supabase.rpc("calculate_match_points", { p_match_id: match_id });

  return NextResponse.json({ ok: true, predictions_processed: count ?? 0 });
}
