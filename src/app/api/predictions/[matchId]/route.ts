import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";

export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const matchId = parseInt(params.matchId, 10);
  if (isNaN(matchId)) {
    return NextResponse.json({ error: "matchId inválido." }, { status: 400 });
  }

  const { data: prediction } = await supabase
    .from("predictions")
    .select("id, match_id, home_score, away_score, outcome, points_earned, created_at, updated_at")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prediction) {
    return NextResponse.json({ data: null }, { status: 404 });
  }

  return NextResponse.json({ data: prediction }, { status: 200 });
}
