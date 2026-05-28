import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const redirectTo = searchParams.redirect?.startsWith("/") ? searchParams.redirect : undefined;
  return <RegisterForm redirectTo={redirectTo} />;
}
