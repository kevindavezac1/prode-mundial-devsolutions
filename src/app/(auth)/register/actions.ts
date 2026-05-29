"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export async function register(input: RegisterInput, redirectTo?: string) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const emailRedirectTo = redirectTo?.startsWith("/")
    ? `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`
    : `${siteUrl}/auth/callback`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo,
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already in use") ||
      error.message.toLowerCase().includes("email address is already")
    ) {
      return { error: "Este email ya tiene una cuenta.", emailInUse: true as const };
    }
    return { error: "Error al crear la cuenta. Intentá de nuevo." };
  }

  return { success: true, email: parsed.data.email };
}
