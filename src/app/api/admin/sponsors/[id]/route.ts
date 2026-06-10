import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function assertAdmin(request: Request): Promise<boolean> {
  const { user } = await getAuthUser(request);
  if (!user?.email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return allowed.includes(user.email.toLowerCase());
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`PATCH:/api/admin/sponsors:${ip}`, 20))) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  if (!(await assertAdmin(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  const { nombre, descripcion, link_url, activo, orden } = body;
  if (nombre !== undefined && !nombre?.trim()) {
    return NextResponse.json({ error: "El nombre no puede estar vacío." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (nombre !== undefined) update.nombre = nombre.trim();
  if (descripcion !== undefined) update.descripcion = descripcion?.trim() || null;
  if (link_url !== undefined) update.link_url = link_url?.trim() || null;
  if (activo !== undefined) update.activo = activo;
  if (orden !== undefined) update.orden = orden;

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("sponsors")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/admin/sponsors/:id]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`DELETE:/api/admin/sponsors:${ip}`, 20))) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  if (!(await assertAdmin(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = serviceClient();

  // Delete logo from storage (best-effort)
  await supabase.storage.from("sponsors").remove([`${id}/logo.jpg`, `${id}/logo.png`, `${id}/logo.webp`]);

  const { error } = await supabase.from("sponsors").delete().eq("id", id);
  if (error) {
    console.error("[DELETE /api/admin/sponsors/:id]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
