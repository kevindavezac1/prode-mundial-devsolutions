"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateLeagueImageUrl(
  leagueId: string,
  imageUrl: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: league } = await supabase
    .from("leagues")
    .select("owner_id")
    .eq("id", leagueId)
    .single();

  if (!league || league.owner_id !== user.id) return { error: "Sin permiso." };

  const { error } = await supabase
    .from("leagues")
    .update({ image_url: imageUrl })
    .eq("id", leagueId);

  if (error) return { error: "Error al actualizar la imagen." };

  revalidatePath("/leagues");
  revalidatePath(`/leagues/${leagueId}`);
  return {};
}
