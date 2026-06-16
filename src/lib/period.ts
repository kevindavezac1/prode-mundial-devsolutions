import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MatchPhase = Database["public"]["Enums"]["match_phase"];

export type Period = {
  label: string;
  phase: MatchPhase;
  matchNumberMin?: number;
  matchNumberMax?: number;
};

function matchToPeriod(phase: MatchPhase, matchNumber: number): Period | null {
  if (phase === "group") {
    if (matchNumber <= 24) return { label: "FECHA 1", phase: "group", matchNumberMin: 1,  matchNumberMax: 24 };
    if (matchNumber <= 48) return { label: "FECHA 2", phase: "group", matchNumberMin: 25, matchNumberMax: 48 };
    return                        { label: "FECHA 3", phase: "group", matchNumberMin: 49, matchNumberMax: 72 };
  }
  if (phase === "round_of_16")  return { label: "16AVOS",  phase: "round_of_16" };
  if (phase === "quarterfinal") return { label: "CUARTOS", phase: "quarterfinal" };
  if (phase === "semifinal")    return { label: "SEMIS",   phase: "semifinal" };
  return null; // third_place, final → solo total_points
}

export async function getCurrentPeriod(): Promise<Period | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("phase, match_number")
    .eq("status", "finished")
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;
  return matchToPeriod(data.phase, data.match_number);
}

export async function getPeriodPoints(userId: string, period: Period): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("predictions")
    .select("points_earned, matches!inner(phase, match_number)")
    .eq("user_id", userId)
    .eq("matches.phase", period.phase)
    .gte("matches.match_number", period.matchNumberMin ?? 0)
    .lte("matches.match_number", period.matchNumberMax ?? 9999);

  return (data ?? []).reduce((sum, p) => sum + (p.points_earned ?? 0), 0);
}
