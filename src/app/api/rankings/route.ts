import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, total_points, exact_predictions, correct_predictions, total_predictions")
    .order("total_points", { ascending: false })
    .order("exact_predictions", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[GET /api/rankings]", error);
    return NextResponse.json({ error: "Error al cargar los rankings." }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
