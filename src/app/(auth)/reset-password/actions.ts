"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";

export async function resetPassword(input: ResetPasswordInput) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: "No se pudo actualizar la contraseña. El link puede haber expirado." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
