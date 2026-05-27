"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitResult } from "@/app/(protected)/admin/actions";
import type { MatchWithTeams } from "@/types/matches";

type Filter = "pending" | "finished" | "all";

type Props = { matches: MatchWithTeams[] };

function FormattedDate({ scheduledAt }: { scheduledAt: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    setText(
      new Date(scheduledAt).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [scheduledAt]);
  return <>{text ?? "–"}</>;
}

const statusLabel: Record<string, string> = {
  scheduled: "Programado",
  live: "En vivo",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const statusColor: Record<string, string> = {
  scheduled: "",
  live: "text-red-400 font-semibold",
  finished: "text-green-400",
  cancelled: "line-through",
};

export function AdminPanel({ matches }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const [editing, setEditing] = useState<MatchWithTeams | null>(null);
  const [homeVal, setHomeVal] = useState("");
  const [awayVal, setAwayVal] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = matches.filter((m) => {
    if (filter === "pending") return m.status === "scheduled" || m.status === "live";
    if (filter === "finished") return m.status === "finished";
    return true;
  });

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

  const filters: { key: Filter; label: string }[] = [
    { key: "pending", label: "Pendientes" },
    { key: "finished", label: "Finalizados" },
    { key: "all", label: "Todos" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
            style={
              filter === key
                ? {
                    background: "linear-gradient(135deg, #E4002B 0%, #B8001F 100%)",
                    color: "white",
                    boxShadow: "0 2px 10px rgba(228,0,43,0.2)",
                  }
                : { color: "rgba(255,255,255,0.4)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Match list */}
      {filtered.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          Sin partidos en esta categoría.
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((match) => (
          <div
            key={match.id}
            className="rounded-2xl px-4 py-3 space-y-2"
            style={{
              background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  {match.home_team.code} vs {match.away_team.code}
                </p>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {match.home_team.name} · {match.away_team.name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs ${statusColor[match.status]}`} style={!statusColor[match.status] ? { color: "rgba(255,255,255,0.4)" } : undefined}>
                  {statusLabel[match.status]}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <FormattedDate scheduledAt={match.scheduled_at} />
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-mono tabular-nums text-white">
                {match.status === "finished"
                  ? `${match.home_score} – ${match.away_score}`
                  : "— vs —"}
              </span>
              {(match.status === "scheduled" || match.status === "live" || match.status === "finished") && (
                <button
                  className="h-7 px-3 text-xs font-semibold rounded-lg transition-all active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "white",
                  }}
                  onClick={() => openModal(match)}
                >
                  {match.status === "finished" ? "Corregir" : "Cargar resultado"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
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
              <span className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
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
