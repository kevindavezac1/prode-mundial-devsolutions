"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(
  displayName: string
): Promise<{ error?: string }> {
  const name = displayName.trim();
  if (!name) return { error: "El nombre no puede estar vacío." };
  if (name.length > 30) return { error: "El nombre no puede superar los 30 caracteres." };
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9 .\-]+$/.test(name)) {
    return { error: "El nombre solo puede contener letras, números, espacios, guiones y puntos." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Sync auth user metadata so dashboard (which reads user_metadata.display_name) reflects the change
  await supabase.auth.updateUser({ data: { display_name: name } });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/rankings");
  revalidateTag("global-rankings");
  return {};
}
