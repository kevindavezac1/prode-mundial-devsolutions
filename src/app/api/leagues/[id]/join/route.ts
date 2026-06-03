import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`POST:/api/leagues/join-by-id:${ip}`, 10)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intentá en un minuto." }, { status: 429 });
  }

  const { user, supabase } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const leagueId = params.id;

  const admin = adminClient();

  // Verify league exists
  const { data: league } = await admin
    .from("leagues")
    .select("id, max_members")
    .eq("id", leagueId)
    .single();

  if (!league) return NextResponse.json({ error: "Liga no encontrada." }, { status: 404 });

  // Check ban — must use admin client (user is not a member yet, RLS blocks)
  const { data: ban } = await admin
    .from("league_bans")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ban) {
    return NextResponse.json(
      { error: "Fuiste expulsado de esta liga y no podés volver a unirte." },
      { status: 403 }
    );
  }

  // Check already a member
  const { data: existing } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Ya sos miembro de esta liga." }, { status: 409 });

  // Check capacity
  const { count } = await supabase
    .from("league_members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", leagueId);

  if ((count ?? 0) >= league.max_members) {
    return NextResponse.json({ error: "La liga está llena." }, { status: 409 });
  }

  const { error } = await supabase
    .from("league_members")
    .insert({ league_id: leagueId, user_id: user.id });

  if (error) {
    console.error("[POST /api/leagues/:id/join]", error);
    return NextResponse.json({ error: "Error al unirse a la liga." }, { status: 500 });
  }

  return NextResponse.json({ data: { league_id: leagueId } }, { status: 201 });
}
