import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { PredictionsMap } from "@/types/matches";

export async function GET(request: Request) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data } = await supabase
    .from("predictions")
    .select("id, match_id, home_score, away_score, outcome, points_earned, predicted_penalty_winner")
    .eq("user_id", user.id);

  const map: PredictionsMap = {};
  for (const p of data ?? []) {
    map[p.match_id] = p as PredictionsMap[number];
  }

  return NextResponse.json({ data: map });
}

const schema = z.object({
  match_id:                  z.number().int().positive(),
  home_score:                z.number().int().min(0).max(20),
  away_score:                z.number().int().min(0).max(20),
  predicted_penalty_winner:  z.enum(["home", "away"]).nullable().optional(),
});

export async function POST(request: Request) {
  // Rate limit: 30 predicciones por minuto por IP
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`POST:/api/predictions:${ip}`, 30))) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intentá en un minuto." }, { status: 429 });
  }

  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!(await checkRateLimit(`ratelimit:user:${user.id}`, 20))) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { match_id, home_score, away_score } = parsed.data;

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, status, scheduled_at, phase")
    .eq("id", match_id)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
  }

  const lockedAt = new Date(match.scheduled_at).getTime() - 5 * 60 * 1000;
  if (Date.now() >= lockedAt) {
    return NextResponse.json(
      { error: "Las predicciones para este partido están cerradas." },
      { status: 422 }
    );
  }

  if (match.status === "cancelled") {
    return NextResponse.json(
      { error: "El partido fue cancelado." },
      { status: 422 }
    );
  }

  const { predicted_penalty_winner } = parsed.data;
  const isKnockout = match.phase !== "group";
  const isDraw = home_score === away_score;

  if (isKnockout && isDraw && !predicted_penalty_winner) {
    return NextResponse.json(
      { error: "En eliminatorias, un empate requiere indicar el ganador en penales." },
      { status: 422 }
    );
  }

  // Si el score no es empate, ignorar el campo de penales aunque venga en el body
  const penaltyWinner = isDraw ? (predicted_penalty_winner ?? null) : null;

  // Try INSERT first. On unique conflict (user already predicted this match), fall back to UPDATE.
  // Cannot use upsert: ON CONFLICT DO UPDATE SET would include user_id/match_id which are not
  // in the column-level UPDATE grant (only home_score, away_score are allowed).
  // updated_at is set server-side by trg_predictions_updated_at (migration 012).
  const { data: inserted, error: insertError } = await supabase
    .from("predictions")
    .insert({ user_id: user.id, match_id, home_score, away_score, predicted_penalty_winner: penaltyWinner })
    .select()
    .single();

  let prediction = inserted;
  let error = insertError;

  if (insertError?.code === "23505") {
    const { data: updated, error: updateError } = await supabase
      .from("predictions")
      .update({ home_score, away_score, predicted_penalty_winner: penaltyWinner })
      .eq("user_id", user.id)
      .eq("match_id", match_id)
      .select()
      .single();
    prediction = updated;
    error = updateError;
  }

  if (error) {
    console.error("[POST /api/predictions]", error);
    return NextResponse.json({ error: "Error al guardar la predicción." }, { status: 500 });
  }

  return NextResponse.json({ data: prediction }, { status: 200 });
}
