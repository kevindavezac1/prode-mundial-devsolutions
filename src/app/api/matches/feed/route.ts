import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { MatchWithTeams, Prediction } from "@/types/matches";

export type MatchWithPrediction = MatchWithTeams & {
  userPrediction: Prediction | null;
};

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`GET:/api/matches/feed:${ip}`, 60)) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const [matchesResult, predictionsResult] = await Promise.all([
    supabase
      .from("matches")
      .select(
        `id, match_number, phase, scheduled_at, venue, status,
         home_score, away_score,
         home_team:teams!home_team_id(id, name, code, flag_url),
         away_team:teams!away_team_id(id, name, code, flag_url)`
      )
      .order("scheduled_at"),
    supabase
      .from("predictions")
      .select("id, match_id, home_score, away_score, outcome, points_earned")
      .eq("user_id", user.id),
  ]);

  if (matchesResult.error) {
    return NextResponse.json({ error: "Error cargando partidos." }, { status: 500 });
  }

  const predMap = new Map<number, Prediction>();
  for (const p of predictionsResult.data ?? []) {
    predMap.set(p.match_id, p as Prediction);
  }

  const data: MatchWithPrediction[] = (
    matchesResult.data ?? []
  ).map((m) => ({
    ...(m as unknown as MatchWithTeams),
    userPrediction: predMap.get(m.id) ?? null,
  }));

  return NextResponse.json({ data });
}
