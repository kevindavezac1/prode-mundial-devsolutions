import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/auth";
import type { PredictionsMap } from "@/types/matches";

export async function GET(request: Request) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data } = await supabase
    .from("predictions")
    .select("id, match_id, home_score, away_score, outcome, points_earned")
    .eq("user_id", user.id);

  const map: PredictionsMap = {};
  for (const p of data ?? []) {
    map[p.match_id] = p as PredictionsMap[number];
  }

  return NextResponse.json({ data: map });
}

const schema = z.object({
  match_id:   z.number().int().positive(),
  home_score: z.number().int().min(0).max(20),
  away_score: z.number().int().min(0).max(20),
});

export async function POST(request: Request) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
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
    .select("id, status, scheduled_at")
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

  const { data: prediction, error } = await supabase
    .from("predictions")
    .upsert(
      { user_id: user.id, match_id, home_score, away_score, updated_at: new Date().toISOString() },
      { onConflict: "user_id,match_id" }
    )
    .select()
    .single();

  if (error) {
    if (error.code === "42501" || error.code === "PGRST301") {
      return NextResponse.json(
        { error: "No podés modificar esta predicción." },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "Error al guardar la predicción." }, { status: 500 });
  }

  return NextResponse.json({ data: prediction }, { status: 200 });
}
