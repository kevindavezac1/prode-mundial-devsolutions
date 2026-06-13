"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { forgotPassword } from "@/app/(auth)/forgot-password/actions";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  function onSubmit(data: ForgotPasswordInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await forgotPassword(data);
      if (result.error) {
        setServerError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="text-5xl">📧</div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Revisá tu email</h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Si <span className="text-white font-medium">{getValues("email")}</span> tiene una cuenta,
            te enviamos un link para resetear tu contraseña.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full h-11 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-white">Recuperar contraseña</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Te enviamos un link para resetearla
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email" className="text-white">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            disabled={isPending}
            className="rounded-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            }}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-destructive text-center">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #74ACDF 0%, #4a8bc4 100%)",
            boxShadow: "0 4px 20px rgba(116,172,223,0.3)",
          }}
        >
          {isPending ? "Enviando..." : "Enviar link"}
        </button>
      </form>

      <div className="flex justify-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-colors hover:opacity-100"
          style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          ← Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
