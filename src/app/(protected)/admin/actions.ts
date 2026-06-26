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

    revalidateTag("global-rankings");

    return { ok: true, predictions_processed: count ?? 0 };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido." };
  }
}
