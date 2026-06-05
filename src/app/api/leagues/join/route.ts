import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Service role bypasses RLS — used only for invite_code lookup on private leagues
function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  // Rate limit: 10 intentos por minuto por IP
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`POST:/api/leagues/join:${ip}`, 10))) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intentá en un minuto." }, { status: 429 });
  }

  const { user, supabase } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (!(await checkRateLimit(`ratelimit:user:${user.id}`, 10))) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const raw = typeof body.invite_code === "string" ? body.invite_code.trim().toUpperCase() : "";

  // Validar: requerido, máximo 8 caracteres (códigos son siempre 8)
  if (!raw || raw.length > 8) {
    return NextResponse.json({ error: "Código de invitación inválido." }, { status: 400 });
  }

  const invite_code = raw;

  // Must use admin client: user is not yet a member, so RLS blocks the lookup
  const { data: league } = await adminClient()
    .from("leagues")
    .select("id, invite_code, max_members")
    .eq("invite_code", invite_code)
    .single();

  if (!league) return NextResponse.json({ error: "Código incorrecto o liga inexistente." }, { status: 404 });

  // Check ban — admin client needed (user not a member yet)
  const { data: ban } = await adminClient()
    .from("league_bans")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ban) {
    return NextResponse.json(
      { error: "Fuiste expulsado de esta liga y no podés volver a unirte." },
      { status: 403 }
    );
  }

  const { data: existing } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Ya sos miembro de esta liga." }, { status: 409 });

  const { count } = await supabase
    .from("league_members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", league.id);

  if ((count ?? 0) >= league.max_members) {
    return NextResponse.json({ error: "La liga está llena." }, { status: 409 });
  }

  const { error } = await supabase
    .from("league_members")
    .insert({ league_id: league.id, user_id: user.id });

  if (error) {
    console.error("[POST /api/leagues/join]", error);
    return NextResponse.json({ error: "Error al unirse a la liga." }, { status: 500 });
  }

  return NextResponse.json({ data: { league_id: league.id } }, { status: 201 });
}
