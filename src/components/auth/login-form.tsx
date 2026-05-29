"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { login, loginWithGoogle } from "@/app/(auth)/login/actions";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  function onSubmit(data: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await login(data, redirectTo);
      if (result?.error) setServerError(result.error);
    });
  }

  function handleGoogle() {
    startTransition(async () => {
      const result = await loginWithGoogle(redirectTo);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-colors hover:opacity-100"
        style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        ← Volver al inicio
      </Link>

      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-white">Iniciá sesión</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Prode Mundial 2026</p>
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

        <div className="space-y-1">
          <Label htmlFor="password" className="text-white">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isPending}
            className="rounded-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            }}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
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
            background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
            boxShadow: "0 4px 16px rgba(228,0,43,0.25)",
          }}
        >
          {isPending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span
            className="px-2"
            style={{ background: "#07090f", color: "rgba(255,255,255,0.3)" }}
          >
            o
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={isPending}
        className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "white",
        }}
      >
        <GoogleIcon />
        Continuar con Google
      </button>

      <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-semibold hover:underline" style={{ color: "#E4002B" }}>
          Registrate
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
