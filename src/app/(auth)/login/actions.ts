"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export async function login(input: LoginInput, redirectTo?: string) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message === "Email not confirmed") {
      return { error: "Tenés que verificar tu email antes de entrar. Revisá tu bandeja de entrada." };
    }
    return { error: "Email o contraseña incorrectos." };
  }

  const destination = redirectTo?.startsWith("/") ? redirectTo : "/dashboard";
  revalidatePath("/", "layout");
  redirect(destination);
}

export async function loginWithGoogle(redirectTo?: string) {
  const supabase = await createClient();

  const base = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`;
  const callbackUrl =
    redirectTo?.startsWith("/")
      ? `${base}?next=${encodeURIComponent(redirectTo)}`
      : base;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return { error: "No se pudo iniciar sesión con Google." };
  }

  redirect(data.url);
}
