"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  scheduled: "text-muted-foreground",
  live: "text-red-500 font-semibold",
  finished: "text-green-600",
  cancelled: "text-muted-foreground line-through",
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
      <div className="flex rounded-lg bg-muted p-1 gap-1">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Match list */}
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Sin partidos en esta categoría.
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((match) => (
          <div
            key={match.id}
            className="rounded-xl border bg-card px-4 py-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {match.home_team.code} vs {match.away_team.code}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {match.home_team.name} · {match.away_team.name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs ${statusColor[match.status]}`}>
                  {statusLabel[match.status]}
                </p>
                <p className="text-xs text-muted-foreground">
                  <FormattedDate scheduledAt={match.scheduled_at} />
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-mono tabular-nums">
                {match.status === "finished"
                  ? `${match.home_score} – ${match.away_score}`
                  : "— vs —"}
              </span>
              {(match.status === "scheduled" || match.status === "live" || match.status === "finished") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => openModal(match)}
                >
                  {match.status === "finished" ? "Corregir" : "Cargar resultado"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/50">
          <div className="bg-background rounded-xl p-6 w-full max-w-sm space-y-5 shadow-xl">
            <div>
              <h2 className="font-bold text-base">Cargar resultado</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {editing.home_team.name} vs {editing.away_team.name}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-xs text-muted-foreground text-center">
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
                  className="w-full h-14 rounded-md border border-input bg-background text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>
              <span className="text-xl font-bold text-muted-foreground">—</span>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-muted-foreground text-center">
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
                  className="w-full h-14 rounded-md border border-input bg-background text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeModal}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isPending || homeVal === "" || awayVal === ""}
              >
                {isPending ? "Guardando…" : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
