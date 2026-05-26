"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

async function assertAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("No autenticado.");
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  if (!allowed.includes(user.email.toLowerCase())) throw new Error("No autorizado.");
  return user.id;
}

export async function submitResult(
  matchId: number,
  homeScore: number,
  awayScore: number
): Promise<{ ok: true; predictions_processed: number } | { error: string }> {
  try {
    const adminId = await assertAdmin();

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: match } = await supabase
      .from("matches")
      .select("home_score, away_score")
      .eq("id", matchId)
      .single();

    if (!match) return { error: "Partido no encontrado." };

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: "finished",
        result_updated_at: new Date().toISOString(),
        result_source: "admin",
      })
      .eq("id", matchId);

    if (updateError) return { error: updateError.message };

    await supabase.from("result_audit_log").insert({
      match_id: matchId,
      changed_by: adminId,
      source: "admin",
      previous_home: match.home_score ?? null,
      previous_away: match.away_score ?? null,
      new_home: homeScore,
      new_away: awayScore,
    });

    const { data: count } = await supabase.rpc("calculate_match_points", {
      p_match_id: matchId,
    });

    revalidateTag("global-rankings");

    return { ok: true, predictions_processed: count ?? 0 };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido." };
  }
}
