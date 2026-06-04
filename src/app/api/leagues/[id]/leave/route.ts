import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`DELETE:/api/leagues/leave:${ip}`, 10))) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intentá en un minuto." }, { status: 429 });
  }

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

  if (league.owner_id === user.id) {
    return NextResponse.json(
      { error: "El creador no puede salirse. Eliminá la liga si ya no la querés." },
      { status: 403 }
    );
  }

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

  if (error) {
    console.error("[DELETE /api/leagues/:id/leave]", error);
    return NextResponse.json({ error: "Error al salir de la liga." }, { status: 500 });
  }

  revalidatePath("/leagues");
  return NextResponse.json({ ok: true });
}
