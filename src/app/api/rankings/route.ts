import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`GET:/api/rankings:${ip}`, 30))) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, total_points, exact_predictions, correct_predictions, total_predictions")
    .order("total_points", { ascending: false })
    .order("exact_predictions", { ascending: false });

  if (error) {
    console.error("[GET /api/rankings]", error);
    return NextResponse.json({ error: "Error al cargar los rankings." }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
