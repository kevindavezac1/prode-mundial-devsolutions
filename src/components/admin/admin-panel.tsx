"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitResult } from "@/app/(protected)/admin/actions";
import { FlagEmoji } from "@/components/match/FlagEmoji";
import type { MatchWithTeams } from "@/types/matches";

type Props = { matches: MatchWithTeams[] };

function getMatchDate(scheduledAt: string): string {
  return new Date(scheduledAt).toLocaleDateString("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function MatchTime({ scheduledAt }: { scheduledAt: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    setText(
      new Date(scheduledAt).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [scheduledAt]);
  return <>{text ?? "–"}</>;
}

function StatusBadge({ status }: { status: MatchWithTeams["status"] }) {
  if (status === "live") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(228,0,43,0.15)",
          color: "#E4002B",
          border: "1px solid rgba(228,0,43,0.3)",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        EN VIVO
      </span>
    );
  }
  if (status === "finished") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(34,197,94,0.1)",
          color: "#4ade80",
          border: "1px solid rgba(34,197,94,0.2)",
        }}
      >
        ✓ Finalizado
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span
        className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.3)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        Cancelado
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{
        background: "rgba(251,146,60,0.1)",
        color: "rgba(251,146,60,0.85)",
        border: "1px solid rgba(251,146,60,0.2)",
      }}
    >
      ● Pendiente
    </span>
  );
}

export function AdminPanel({ matches }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<MatchWithTeams | null>(null);
  const [homeVal, setHomeVal] = useState("");
  const [awayVal, setAwayVal] = useState("");
  const [isPending, startTransition] = useTransition();

  const dates = Array.from(new Set(matches.map((m) => getMatchDate(m.scheduled_at)))).sort();
  const matchesByDate: Record<string, MatchWithTeams[]> = {};
  for (const d of dates) {
    matchesByDate[d] = matches.filter((m) => getMatchDate(m.scheduled_at) === d);
  }

  function getDefaultIdx(): number {
    if (dates.length === 0) return 0;
    const today = new Date().toISOString().split("T")[0];
    const todayIdx = dates.indexOf(today);
    if (todayIdx !== -1) return todayIdx;
    const futurePending = dates.find(
      (d) =>
        d >= today &&
        (matchesByDate[d] ?? []).some(
          (m) => m.status === "scheduled" || m.status === "live"
        )
    );
    if (futurePending) return dates.indexOf(futurePending);
    return dates.length - 1;
  }

  const [dateIdx, setDateIdx] = useState(() => getDefaultIdx());
  const currentDate = dates[dateIdx] ?? null;
  const currentMatches = currentDate ? (matchesByDate[currentDate] ?? []) : [];

  const today = new Date().toISOString().split("T")[0];
  const pendingToday = (matchesByDate[today] ?? []).filter(
    (m) => m.status === "scheduled" || m.status === "live"
  ).length;

  function openModal(match: MatchWithTeams) {
    setEditing(match);
    setHomeVal(match.home_score !== null ? String(match.home_score) : "");
    setAwayVal(match.away_score !== null ? String(match.away_score) : "");
  }

  function closeModal() {
    setEditing(null);
    setHomeVal("");
    setAwayVal("");
  }

  function handleSubmit() {
    if (!editing) return;
    const h = parseInt(homeVal, 10);
    const a = parseInt(awayVal, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      toast.error("Scores inválidos.");
      return;
    }
    startTransition(async () => {
      const result = await submitResult(editing.id, h, a);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(
          `Resultado guardado. ${result.predictions_processed} predicción${
            result.predictions_processed !== 1 ? "es" : ""
          } procesada${result.predictions_processed !== 1 ? "s" : ""}.`
        );
        closeModal();
        router.refresh();
      }
    });
  }

  if (dates.length === 0) {
    return (
      <p className="text-sm text-center py-10" style={{ color: "rgba(255,255,255,0.3)" }}>
        Sin partidos disponibles.
      </p>
    );
  }

  return (
    <div className="space-y-4">

      {/* Date navigator */}
      <div className="space-y-2">
        {pendingToday > 0 && (
          <p
            className="text-[11px] font-bold text-center"
            style={{ color: "rgba(251,146,60,0.8)", letterSpacing: "1px" }}
          >
            {pendingToday} partido{pendingToday !== 1 ? "s" : ""} pendiente{pendingToday !== 1 ? "s" : ""} hoy
          </p>
        )}
        <div
          className="flex items-center justify-between rounded-2xl px-3 py-2.5"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <button
            onClick={() => setDateIdx((i) => Math.max(0, i - 1))}
            disabled={dateIdx === 0}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-lg font-bold transition-all active:scale-95 disabled:opacity-20"
            style={{ color: "white" }}
          >
            ←
          </button>
          <div className="text-center">
            <p className="font-bold text-sm text-white capitalize">
              {currentDate ? formatDateLabel(currentDate) : "—"}
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              {dateIdx + 1} / {dates.length}
            </p>
          </div>
          <button
            onClick={() => setDateIdx((i) => Math.min(dates.length - 1, i + 1))}
            disabled={dateIdx === dates.length - 1}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-lg font-bold transition-all active:scale-95 disabled:opacity-20"
            style={{ color: "white" }}
          >
            →
          </button>
        </div>
      </div>

      {/* Match cards */}
      {currentMatches.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          Sin partidos este día.
        </p>
      )}

      <div className="space-y-3">
        {currentMatches.map((match) => {
          const isOpen = match.status === "scheduled" || match.status === "live";
          return (
            <div
              key={match.id}
              className="rounded-2xl p-4 space-y-3"
              style={{
                background: isOpen
                  ? "linear-gradient(160deg, #0f1322 0%, #07090f 100%)"
                  : "linear-gradient(160deg, #0a0e18 0%, #07090f 100%)",
                border: isOpen
                  ? "1px solid rgba(251,146,60,0.12)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Teams + score */}
              <div className="flex items-center gap-2">
                {/* Home */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FlagEmoji
                    code={match.home_team.code}
                    flagUrl={match.home_team.flag_url}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                    alt={match.home_team.name}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{match.home_team.code}</p>
                    <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {match.home_team.name}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-center shrink-0 px-1">
                  {match.status === "finished" ? (
                    <p className="font-display text-2xl text-white tabular-nums">
                      {match.home_score} — {match.away_score}
                    </p>
                  ) : (
                    <p
                      className="font-display text-xl tabular-nums"
                      style={{ color: "rgba(255,255,255,0.15)" }}
                    >
                      — —
                    </p>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
                  <FlagEmoji
                    code={match.away_team.code}
                    flagUrl={match.away_team.flag_url}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                    alt={match.away_team.name}
                  />
                  <div className="min-w-0 text-right">
                    <p className="text-sm font-bold text-white">{match.away_team.code}</p>
                    <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {match.away_team.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta: status + time + phase + action */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <StatusBadge status={match.status} />
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                    <MatchTime scheduledAt={match.scheduled_at} /> · {match.phase}
                  </span>
                </div>

                {match.status !== "cancelled" && (
                  <button
                    onClick={() => openModal(match)}
                    className="shrink-0 h-7 px-3 text-xs font-semibold rounded-lg transition-all active:scale-95"
                    style={
                      isOpen
                        ? {
                            background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                            color: "white",
                            boxShadow: "0 2px 8px rgba(228,0,43,0.25)",
                          }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.45)",
                          }
                    }
                  >
                    {isOpen ? "Cargar resultado" : "Editar"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm space-y-5"
            style={{
              background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div>
              <h2 className="font-bold text-base text-white">Cargar resultado</h2>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {editing.home_team.name} vs {editing.away_team.name}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {editing.home_team.code}
                </p>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  value={homeVal}
                  onChange={(e) => setHomeVal(e.target.value)}
                  disabled={isPending}
                  className="w-full h-14 rounded-xl text-center text-2xl font-bold text-white focus:outline-none disabled:opacity-50 font-display"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              </div>
              <span className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                —
              </span>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {editing.away_team.code}
                </p>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  value={awayVal}
                  onChange={(e) => setAwayVal(e.target.value)}
                  disabled={isPending}
                  className="w-full h-14 rounded-xl text-center text-2xl font-bold text-white focus:outline-none disabled:opacity-50 font-display"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                }}
                onClick={closeModal}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                  boxShadow: "0 4px 16px rgba(228,0,43,0.25)",
                }}
                onClick={handleSubmit}
                disabled={isPending || homeVal === "" || awayVal === ""}
              >
                {isPending ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
