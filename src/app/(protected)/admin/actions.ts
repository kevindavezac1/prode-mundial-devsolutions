"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Bracket progression ──────────────────────────────────────────────────────

type BracketEdge = {
  nextMatchNumber: number;
  side: "home" | "away";
  loserNext?: { matchNumber: number; side: "home" | "away" };
};

const BRACKET_MAP: Record<number, BracketEdge> = {
  // R16 (73-88) → R8 (89-96) — cuadro oficial FIFA
  74: { nextMatchNumber: 89, side: "home" },
  77: { nextMatchNumber: 89, side: "away" },
  73: { nextMatchNumber: 90, side: "home" },
  75: { nextMatchNumber: 90, side: "away" },
  76: { nextMatchNumber: 91, side: "home" },
  78: { nextMatchNumber: 91, side: "away" },
  79: { nextMatchNumber: 92, side: "home" },
  80: { nextMatchNumber: 92, side: "away" },
  83: { nextMatchNumber: 93, side: "home" },
  84: { nextMatchNumber: 93, side: "away" },
  81: { nextMatchNumber: 94, side: "home" },
  82: { nextMatchNumber: 94, side: "away" },
  86: { nextMatchNumber: 95, side: "home" },
  88: { nextMatchNumber: 95, side: "away" },
  85: { nextMatchNumber: 96, side: "home" },
  87: { nextMatchNumber: 96, side: "away" },
  // R8 (89-96) → QF (97-100)
  89: { nextMatchNumber: 97, side: "home" },
  90: { nextMatchNumber: 97, side: "away" },
  93: { nextMatchNumber: 98, side: "home" },
  94: { nextMatchNumber: 98, side: "away" },
  91: { nextMatchNumber: 99, side: "home" },
  92: { nextMatchNumber: 99, side: "away" },
  95: { nextMatchNumber: 100, side: "home" },
  96: { nextMatchNumber: 100, side: "away" },
  // QF (97-100) → SF (101-102)
  97:  { nextMatchNumber: 101, side: "home" },
  98:  { nextMatchNumber: 101, side: "away" },
  99:  { nextMatchNumber: 102, side: "home" },
  100: { nextMatchNumber: 102, side: "away" },
  // SF (101-102) → Final (104) + 3er puesto (103)
  101: { nextMatchNumber: 104, side: "home", loserNext: { matchNumber: 103, side: "home" } },
  102: { nextMatchNumber: 104, side: "away", loserNext: { matchNumber: 103, side: "away" } },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = SupabaseClient<any>;

async function advanceBracket(
  supabase: Supa,
  matchNumber: number,
  winnerTeamId: number,
  loserTeamId: number | null,
): Promise<void> {
  const edge = BRACKET_MAP[matchNumber];
  if (!edge) return;

  const { data: nextMatch } = await supabase
    .from("matches")
    .select("id")
    .eq("match_number", edge.nextMatchNumber)
    .single();

  if (nextMatch) {
    const payload = edge.side === "home"
      ? { home_team_id: winnerTeamId }
      : { away_team_id: winnerTeamId };
    await supabase.from("matches").update(payload).eq("id", nextMatch.id);
  }

  if (edge.loserNext && loserTeamId) {
    const { data: loserMatch } = await supabase
      .from("matches")
      .select("id")
      .eq("match_number", edge.loserNext.matchNumber)
      .single();

    if (loserMatch) {
      const payload = edge.loserNext.side === "home"
        ? { home_team_id: loserTeamId }
        : { away_team_id: loserTeamId };
      await supabase.from("matches").update(payload).eq("id", loserMatch.id);
    }
  }
}

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

export async function uploadSponsorLogo(
  sponsorId: string,
  formData: FormData
): Promise<{ ok: true; url: string } | { error: string }> {
  try {
    await assertAdmin();

    const file = formData.get("logo") as File | null;
    if (!file || file.size === 0) return { error: "No se recibió archivo." };
    if (file.size > 2 * 1024 * 1024) return { error: "El archivo supera 2MB." };

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return { error: "Formato no permitido. Usá jpg, png o webp." };
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${sponsorId}/logo.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("sponsors")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) return { error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage.from("sponsors").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
      .from("sponsors")
      .update({ logo_url: url })
      .eq("id", sponsorId);

    if (dbError) return { error: dbError.message };

    return { ok: true, url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido." };
  }
}

export async function toggleSponsorActive(
  sponsorId: string,
  activo: boolean
): Promise<{ ok: true } | { error: string }> {
  try {
    await assertAdmin();
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase
      .from("sponsors")
      .update({ activo })
      .eq("id", sponsorId);
    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido." };
  }
}

export async function submitResult(
  matchId: number,
  homeScore: number,
  awayScore: number,
  penaltyWinner?: "home" | "away" | null
): Promise<{ ok: true; predictions_processed: number } | { error: string }> {
  if (
    !Number.isInteger(matchId)  || matchId <= 0 ||
    !Number.isInteger(homeScore) || homeScore < 0 || homeScore > 20 ||
    !Number.isInteger(awayScore) || awayScore < 0 || awayScore > 20
  ) {
    return { error: "Datos inválidos." };
  }
  if (penaltyWinner !== undefined && penaltyWinner !== null && penaltyWinner !== "home" && penaltyWinner !== "away") {
    return { error: "Datos inválidos." };
  }
  if (penaltyWinner && homeScore !== awayScore) {
    return { error: "penalty_winner solo aplica cuando hay empate." };
  }

  try {
    const adminId = await assertAdmin();

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        penalty_winner: homeScore === awayScore ? (penaltyWinner ?? null) : null,
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
      previous_home: null,
      previous_away: null,
      new_home: homeScore,
      new_away: awayScore,
    });

    const { data: count } = await supabase.rpc("calculate_match_points", {
      p_match_id: matchId,
    });

    // Bracket progression — non-blocking, failure doesn't affect result submission
    try {
      const { data: matchData } = await supabase
        .from("matches")
        .select("match_number, home_team_id, away_team_id")
        .eq("id", matchId)
        .single();

      if (matchData?.match_number) {
        const effectivePenaltyWinner = homeScore === awayScore ? (penaltyWinner ?? null) : null;
        const winnerSide = effectivePenaltyWinner
          ?? (homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : null);

        if (winnerSide) {
          const winnerId = winnerSide === "home" ? matchData.home_team_id : matchData.away_team_id;
          const loserId  = winnerSide === "home" ? matchData.away_team_id : matchData.home_team_id;
          if (winnerId) {
            await advanceBracket(supabase, matchData.match_number, winnerId, loserId ?? null);
          }
        }
      }
    } catch (bracketErr) {
      console.error("[bracket] progression error:", bracketErr);
    }

    revalidateTag("global-rankings");

    return { ok: true, predictions_processed: count ?? 0 };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido." };
  }
}
