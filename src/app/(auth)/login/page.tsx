import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback_failed: "El link de verificación expiró o ya fue usado. Intentá loguearte o pedí uno nuevo.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  const redirectTo = searchParams.redirect?.startsWith("/") ? searchParams.redirect : undefined;
  const initialError = searchParams.error ? (CALLBACK_ERRORS[searchParams.error] ?? "Error de autenticación. Intentá de nuevo.") : undefined;
  return <LoginForm redirectTo={redirectTo} initialError={initialError} />;
}
