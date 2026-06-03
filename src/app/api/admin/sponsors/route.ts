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

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`POST:/api/admin/sponsors:${ip}`, 20)) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  if (!(await assertAdmin(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  const { nombre, descripcion, link_url, activo, orden } = body;
  if (!nombre?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido." }, { status: 400 });
  }

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("sponsors")
    .insert({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      link_url: link_url?.trim() || null,
      activo: activo ?? true,
      orden: orden ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
