import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { MatchWithTeams } from "@/types/matches";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`GET:/api/matches/bracket:${ip}`, 60))) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .select(
      `id, match_number, phase, scheduled_at, venue, status,
       home_score, away_score, penalty_winner, home_slot, away_slot,
       home_team:teams!home_team_id(id, name, code, flag_url, group_name),
       away_team:teams!away_team_id(id, name, code, flag_url, group_name)`
    )
    .neq("phase", "group")
    .order("match_number");

  if (error) {
    return NextResponse.json({ error: "Error cargando partidos." }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []) as unknown as MatchWithTeams[] });
}
