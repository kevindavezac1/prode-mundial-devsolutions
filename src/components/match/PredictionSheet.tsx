"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { FlagEmoji } from "@/components/match/FlagEmoji";

// ─── Types (sin cambios) ──────────────────────────────────────────────────────

type Team = {
  name: string;
  code: string;
  flag_url?: string | null;
};

export type PredictionSheetMatch = {
  id: number;
  scheduled_at: string;
  home_team: Team;
  away_team: Team;
};

export type PredictionSheetExisting = {
  home_score: number;
  away_score: number;
} | null;

type Props = {
  match: PredictionSheetMatch | null;
  existingPrediction: PredictionSheetExisting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

// ─── Helpers (sin cambios) ────────────────────────────────────────────────────

function formatSheetTime(scheduled_at: string): string {
  const d = new Date(scheduled_at);
  const now = new Date();
  const todayInARG = now.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const matchDayInARG = d.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const time = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  });
  return todayInARG === matchDayInARG ? `Hoy ${time}` : time;
}

// ─── Score stepper ────────────────────────────────────────────────────────────

function ScoreStepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value === 0}
        className="w-11 h-11 rounded-full text-xl font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-25"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.8)",
        }}
        aria-label="Restar"
      >
        −
      </button>

      <div
        className="w-16 h-14 rounded-xl font-display text-4xl flex items-center justify-center leading-none select-none text-white"
        style={{
          background: "linear-gradient(135deg, #0d1120 0%, #07090f 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {value}
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={disabled || value === 20}
        className="w-11 h-11 rounded-full text-xl font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-25"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.8)",
        }}
        aria-label="Sumar"
      >
        +
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PredictionSheet({
  match,
  existingPrediction,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && match) {
      setHomeScore(existingPrediction?.home_score ?? 0);
      setAwayScore(existingPrediction?.away_score ?? 0);
      setError(null);
      setSubmitting(false);
    }
  }, [open, match?.id, existingPrediction?.home_score, existingPrediction?.away_score]);

  async function handleSubmit() {
    if (!match || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match.id,
          home_score: homeScore,
          away_score: awayScore,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "No se pudo guardar tu predicción. Intentá de nuevo.");
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar tu predicción. Intentá de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = existingPrediction !== null;

  return (
    <Sheet open={open} onOpenChange={(isOpen: boolean) => onOpenChange(isOpen)}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-6 pb-10"
        style={{
          background: "linear-gradient(180deg, #0d1120 0%, #07090f 100%)",
          borderTop: "1px solid rgba(228,0,43,0.3)",
        }}
      >
        {/* Top drag handle */}
        <div className="flex justify-center mb-5">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }}
          />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <p
            className="font-display text-xl text-white"
            style={{ letterSpacing: "3px" }}
          >
            TU PREDICCIÓN
          </p>
          {match && (
            <p
              className="text-[11px] mt-1"
              style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "1px" }}
            >
              {formatSheetTime(match.scheduled_at)}
            </p>
          )}
        </div>

        {match && (
          <>
            {/* Home team */}
            <div
              className="flex justify-between items-center py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <FlagEmoji
                  code={match.home_team.code}
                  flagUrl={match.home_team.flag_url}
                  className="text-3xl"
                  alt={match.home_team.name}
                />
                <span
                  className="font-extrabold text-sm text-white"
                  style={{ letterSpacing: "1px" }}
                >
                  {match.home_team.name.toUpperCase()}
                </span>
              </div>
              <ScoreStepper value={homeScore} onChange={setHomeScore} disabled={submitting} />
            </div>

            {/* Away team */}
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <FlagEmoji
                  code={match.away_team.code}
                  flagUrl={match.away_team.flag_url}
                  className="text-3xl"
                  alt={match.away_team.name}
                />
                <span
                  className="font-extrabold text-sm text-white"
                  style={{ letterSpacing: "1px" }}
                >
                  {match.away_team.name.toUpperCase()}
                </span>
              </div>
              <ScoreStepper value={awayScore} onChange={setAwayScore} disabled={submitting} />
            </div>

            {/* Error */}
            {error && (
              <p className="mt-3 text-wc-red text-xs text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-6 w-full py-4 rounded-xl font-extrabold text-[11px] text-white transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: submitting
                  ? "rgba(228,0,43,0.5)"
                  : "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                letterSpacing: "3px",
                boxShadow: submitting ? "none" : "0 4px 20px rgba(228,0,43,0.3)",
              }}
            >
              {submitting
                ? "GUARDANDO..."
                : isEditing
                ? "ACTUALIZAR PREDICCIÓN ⚽"
                : "ENVIAR PREDICCIÓN ⚽"}
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}