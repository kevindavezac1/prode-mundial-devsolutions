import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id: leagueId, userId: targetUserId } = params;

  // Obtener liga y verificar que el caller es owner
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

  // Owner no puede expulsarse a sí mismo
  if (targetUserId === user.id) {
    return NextResponse.json({ error: "No podés expulsarte a vos mismo." }, { status: 400 });
  }

  // Verificar que el target es miembro
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Regenerar código de invitación para que el expulsado no pueda re-unirse con el link viejo
  const newCode = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  await supabase.from("leagues").update({ invite_code: newCode }).eq("id", leagueId);

  return NextResponse.json({ ok: true, invite_code: newCode });
}
