"use server";

import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

export async function forgotPassword(input: ForgotPasswordInput) {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: "Email inválido." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery`,
  });

  // Siempre success para no revelar si el email existe en la base
  return { success: true };
}
