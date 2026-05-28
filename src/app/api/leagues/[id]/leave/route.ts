import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const leagueId = params.id;

  // Verificar que la liga existe y obtener owner
  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id, owner_id")
    .eq("id", leagueId)
    .single();

  if (leagueError || !league) {
    return NextResponse.json({ error: "Liga no encontrada." }, { status: 404 });
  }

  // Owner no puede salirse — debe eliminar la liga
  if (league.owner_id === user.id) {
    return NextResponse.json(
      { error: "El creador no puede salirse. Eliminá la liga si ya no la querés." },
      { status: 403 }
    );
  }

  // Verificar membresía
  const { data: membership } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "No sos miembro de esta liga." }, { status: 403 });
  }

  const { error } = await supabase
    .from("league_members")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Regenerar código silenciosamente para que el miembro que se fue no pueda re-unirse con el link viejo
  const newCode = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  await supabase.from("leagues").update({ invite_code: newCode }).eq("id", leagueId);

  return NextResponse.json({ ok: true });
}
