import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`DELETE:/api/leagues/members:${ip}`, 10)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intentá en un minuto." }, { status: 429 });
  }

  const { user, supabase } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id: leagueId, userId: targetUserId } = params;

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id, owner_id")
    .eq("id", leagueId)
    .single();

  if (leagueError || !league) {
    return NextResponse.json({ error: "Liga no encontrada." }, { status: 404 });
  }

  if (league.owner_id !== user.id) {
    return NextResponse.json({ error: "Solo el creador puede expulsar miembros." }, { status: 403 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "No podés expulsarte a vos mismo." }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId)
    .eq("user_id", targetUserId)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "El usuario no es miembro de esta liga." }, { status: 404 });
  }

  const { error } = await supabase
    .from("league_members")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", targetUserId);

  if (error) {
    console.error("[DELETE /api/leagues/:id/members/:userId]", error);
    return NextResponse.json({ error: "Error al expulsar al miembro." }, { status: 500 });
  }

  const newCode = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  await supabase.from("leagues").update({ invite_code: newCode }).eq("id", leagueId);

  return NextResponse.json({ ok: true, invite_code: newCode });
}
