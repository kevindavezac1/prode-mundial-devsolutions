"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { resetPassword } from "@/app/(auth)/reset-password/actions";

export function ResetPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const passwordValue = watch("password") ?? "";
  const passwordRules = [
    { label: "8 caracteres", ok: passwordValue.length >= 8 },
    { label: "Una mayúscula", ok: /[A-Z]/.test(passwordValue) },
    { label: "Un número", ok: /[0-9]/.test(passwordValue) },
  ];
  const passwordValid = passwordRules.every((r) => r.ok);

  function onSubmit(data: ResetPasswordInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await resetPassword(data);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Elegí una contraseña segura
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="password" className="text-white">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isPending}
            className="rounded-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            }}
            {...register("password")}
          />
          <div className="flex gap-2 flex-wrap pt-1">
            {passwordRules.map((rule) => (
              <span
                key={rule.label}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
                style={{
                  background: rule.ok ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                  color: rule.ok ? "#4ade80" : "rgba(255,255,255,0.3)",
                  border: `1px solid ${rule.ok ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {rule.ok ? "✓ " : ""}{rule.label}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="text-white">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isPending}
            className="rounded-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            }}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-destructive text-center">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isPending || !passwordValid}
          className="w-full h-11 rounded-xl text-base font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #74ACDF 0%, #4a8bc4 100%)",
            boxShadow: "0 4px 20px rgba(116,172,223,0.3)",
          }}
        >
          {isPending ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
