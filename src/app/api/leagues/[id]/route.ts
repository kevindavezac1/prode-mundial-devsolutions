import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`DELETE:/api/leagues/${params.id}:${ip}`, 10)) {
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

  if (league.owner_id !== user.id) {
    return NextResponse.json({ error: "Solo el creador puede eliminar la liga." }, { status: 403 });
  }

  const { error } = await supabase
    .from("leagues")
    .delete()
    .eq("id", leagueId);

  if (error) {
    console.error("[DELETE /api/leagues/:id]", error);
    return NextResponse.json({ error: "Error al eliminar la liga." }, { status: 500 });
  }

  revalidatePath("/leagues");
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`PATCH:/api/leagues/${params.id}:${ip}`, 20)) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  const { user, supabase } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { name, allow_member_invite } = body as { name?: string; allow_member_invite?: boolean };

  const isNameUpdate = name !== undefined;
  const isToggleUpdate = allow_member_invite !== undefined;

  if (!isNameUpdate && !isToggleUpdate) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  if (isNameUpdate && (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 50)) {
    return NextResponse.json(
      { error: "El nombre debe tener entre 3 y 50 caracteres." },
      { status: 400 }
    );
  }

  if (isToggleUpdate && typeof allow_member_invite !== "boolean") {
    return NextResponse.json({ error: "Valor inválido para allow_member_invite." }, { status: 400 });
  }

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select("id, owner_id")
    .eq("id", params.id)
    .single();

  if (leagueError || !league) {
    return NextResponse.json({ error: "Liga no encontrada." }, { status: 404 });
  }

  if (league.owner_id !== user.id) {
    return NextResponse.json({ error: "Solo el creador puede editar la liga." }, { status: 403 });
  }

  const patch: { name?: string; allow_member_invite?: boolean } = {};
  if (isNameUpdate) patch.name = (name as string).trim();
  if (isToggleUpdate) patch.allow_member_invite = allow_member_invite as boolean;

  const { data: updated, error } = await supabase
    .from("leagues")
    .update(patch)
    .eq("id", params.id)
    .select("id, name, allow_member_invite")
    .single();

  if (error) {
    console.error("[PATCH /api/leagues/:id]", error);
    return NextResponse.json({ error: "Error al actualizar la liga." }, { status: 500 });
  }

  revalidatePath(`/leagues/${params.id}`);
  revalidatePath("/leagues");
  return NextResponse.json({ data: updated });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: league, error } = await supabase
    .from("leagues")
    .select("id, name, invite_code, owner_id, max_members, is_public, allow_member_invite, created_at")
    .eq("id", params.id)
    .single();

  if (error || !league) return NextResponse.json({ error: "Liga no encontrada." }, { status: 404 });

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, joined_at, profiles(username, display_name, avatar_url, total_points)")
    .eq("league_id", params.id);

  type MemberRow = {
    user_id: string;
    joined_at: string;
    profiles: { username: string | null; display_name: string; avatar_url: string | null; total_points: number } | null;
  };

  const sorted = ((members ?? []) as unknown as MemberRow[])
    .map((m) => ({
      user_id: m.user_id,
      joined_at: m.joined_at,
      username: m.profiles?.username ?? null,
      display_name: m.profiles?.display_name ?? "Usuario",
      avatar_url: m.profiles?.avatar_url ?? null,
      total_points: m.profiles?.total_points ?? 0,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  return NextResponse.json({ data: { ...(league as object), members: sorted } });
}
