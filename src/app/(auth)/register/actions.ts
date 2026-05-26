"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export async function register(input: RegisterInput) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Este email ya está registrado." };
    }
    return { error: "Error al crear la cuenta. Intentá de nuevo." };
  }

  redirect("/login?registered=true");
}
