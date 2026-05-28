import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const leagueId = params.id;

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id, owner_id")
    .eq("id", leagueId)
    .single();

  if (leagueError || !league) {
    return NextResponse.json({ error: "Liga no encontrada." }, { status: 404 });
  }

  if (league.owner_id !== user.id) {
    return NextResponse.json({ error: "Solo el creador puede eliminar la liga." }, { status: 403 });
  }

  const { error } = await supabase
    .from("leagues")
    .delete()
    .eq("id", leagueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: league, error } = await supabase
    .from("leagues")
    .select("id, name, invite_code, owner_id, max_members, is_public, created_at")
    .eq("id", params.id)
    .single();

  if (error || !league) return NextResponse.json({ error: "Liga no encontrada." }, { status: 404 });

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, joined_at, profiles(display_name, avatar_url, total_points)")
    .eq("league_id", params.id);

  type MemberRow = {
    user_id: string;
    joined_at: string;
    profiles: { display_name: string; avatar_url: string | null; total_points: number } | null;
  };

  const sorted = ((members ?? []) as unknown as MemberRow[])
    .map((m) => ({
      user_id: m.user_id,
      joined_at: m.joined_at,
      display_name: m.profiles?.display_name ?? "Usuario",
      avatar_url: m.profiles?.avatar_url ?? null,
      total_points: m.profiles?.total_points ?? 0,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  return NextResponse.json({ data: { ...league, members: sorted } });
}
