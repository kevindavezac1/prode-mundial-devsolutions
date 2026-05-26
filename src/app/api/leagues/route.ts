import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: memberships, error } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, invite_code, owner_id, max_members, is_public, created_at)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const leagues = (memberships ?? []).map((m) => m.leagues).filter(Boolean);
  const leagueIds = leagues.map((l) => (l as { id: string }).id);

  if (leagueIds.length === 0) return NextResponse.json({ data: [] });

  const { data: counts } = await supabase
    .from("league_members")
    .select("league_id")
    .in("league_id", leagueIds);

  const countMap: Record<string, number> = {};
  for (const c of counts ?? []) {
    countMap[c.league_id] = (countMap[c.league_id] ?? 0) + 1;
  }

  const result = leagues.map((l) => ({ ...(l as object), member_count: countMap[(l as { id: string }).id] ?? 0 }));
  return NextResponse.json({ data: result });
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: "Nombre inválido (2–50 caracteres)." }, { status: 400 });
    }

    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .insert({ name, owner_id: user.id })
      .select()
      .single();

    if (leagueError) {
      console.error("[POST /api/leagues] insert leagues error:", JSON.stringify(leagueError, null, 2));
      return NextResponse.json({ error: leagueError.message, code: leagueError.code }, { status: 500 });
    }

    const { error: memberError } = await supabase
      .from("league_members")
      .insert({ league_id: league.id, user_id: user.id });

    if (memberError) {
      console.error("[POST /api/leagues] insert league_members error:", JSON.stringify(memberError, null, 2));
    }

    return NextResponse.json({ data: league }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leagues] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
