"use client";

import useSWR from "swr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MatchCard } from "./match-card";
import type { MatchWithTeams, Prediction, PredictionsMap } from "@/types/matches";

type Props = { matches: MatchWithTeams[] };

type ApiResponse = { data: PredictionsMap };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type DateGroup = {
  key: string;
  label: string;
  matches: MatchWithTeams[];
};

function groupByDate(matches: MatchWithTeams[], tz: string): DateGroup[] {
  const groups = new Map<string, DateGroup>();

  for (const match of matches) {
    const d = new Date(match.scheduled_at);
    const key = d.toLocaleDateString("es-AR", { timeZone: tz });
    if (!groups.has(key)) {
      const label = d.toLocaleDateString("es-AR", {
        timeZone: tz,
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      groups.set(key, { key, label, matches: [] });
    }
    groups.get(key)!.matches.push(match);
  }

  return Array.from(groups.values());
}

export function MatchesList({ matches }: Props) {
  const { data, mutate } = useSWR<ApiResponse>("/api/predictions", fetcher);
  const predictions = useMemo<PredictionsMap>(() => data?.data ?? {}, [data]);
  const [localTZ, setLocalTZ] = useState<string>("UTC");

  useEffect(() => {
    setLocalTZ(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const groups = useMemo(() => groupByDate(matches, localTZ), [matches, localTZ]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Set default after mount: today in local tz, or next upcoming date
  useEffect(() => {
    const todayKey = new Date().toLocaleDateString("es-AR", { timeZone: localTZ });
    const todayIdx = groups.findIndex((g) => g.key === todayKey);

    if (todayIdx >= 0) {
      setSelectedIdx(todayIdx);
    } else {
      const now = Date.now();
      const nextIdx = groups.findIndex((g) =>
        g.matches.some((m) => new Date(m.scheduled_at).getTime() > now)
      );
      setSelectedIdx(nextIdx >= 0 ? nextIdx : 0);
    }
  }, [groups, localTZ]);

  const handleSave = useCallback(
    async (matchId: number, home: number, away: number) => {
      const optimisticPredictions: PredictionsMap = {
        ...predictions,
        [matchId]: {
          id: predictions[matchId]?.id ?? -1,
          match_id: matchId,
          home_score: home,
          away_score: away,
          outcome: "pending",
          points_earned: 0,
        } satisfies Prediction,
      };

      try {
        await mutate(
          async () => {
            const res = await fetch("/api/predictions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ match_id: matchId, home_score: home, away_score: away }),
            });

            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error ?? "Error al guardar");
            }

            const { data: saved } = await res.json();
            return { data: { ...predictions, [matchId]: saved } };
          },
          {
            optimisticData: { data: optimisticPredictions },
            rollbackOnError: true,
          }
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al guardar la predicción");
      }
    },
    [predictions, mutate]
  );

  const current = groups[selectedIdx];
  const canPrev = selectedIdx > 0;
  const canNext = selectedIdx < groups.length - 1;

  const relativeLabel = useMemo(() => {
    if (!current) return null;
    const todayKey = new Date().toLocaleDateString("es-AR", { timeZone: localTZ });
    const tomorrowKey = new Date(Date.now() + 86400000).toLocaleDateString("es-AR", { timeZone: localTZ });
    const yesterdayKey = new Date(Date.now() - 86400000).toLocaleDateString("es-AR", { timeZone: localTZ });
    if (current.key === todayKey) return "Hoy";
    if (current.key === tomorrowKey) return "Mañana";
    if (current.key === yesterdayKey) return "Ayer";
    return null;
  }, [current, localTZ]);

  return (
    <div>
      {/* Date navigation */}
      <div
        className="sticky top-[60px] z-10 backdrop-blur-sm flex items-center justify-center px-4 py-3"
        style={{
          background: "rgba(7,9,15,0.97)",
          borderBottom: "2px solid rgba(255,255,255,0.12)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="flex items-center gap-1"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            padding: "10px 20px",
          }}
        >
          <button
            onClick={() => setSelectedIdx((i) => i - 1)}
            disabled={!canPrev}
            className="w-10 h-10 flex items-center justify-center rounded-full text-2xl font-light transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90 hover:bg-white/10 cursor-pointer"
            style={{ color: "rgba(255,255,255,0.9)" }}
            aria-label="Día anterior"
          >
            ←
          </button>

          <div className="min-w-[200px] text-center px-2">
            {relativeLabel && (
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#60a5fa" }}>
                {relativeLabel}
              </p>
            )}
            <p className="text-base font-bold capitalize tracking-wide" style={{ color: "rgba(255,255,255,0.97)" }}>
              {current?.label ?? "–"}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {current
                ? `${current.matches.length} partido${current.matches.length !== 1 ? "s" : ""} · ${selectedIdx + 1} / ${groups.length}`
                : ""}
            </p>
          </div>

          <button
            onClick={() => setSelectedIdx((i) => i + 1)}
            disabled={!canNext}
            className="w-10 h-10 flex items-center justify-center rounded-full text-2xl font-light transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-90 hover:bg-white/10 cursor-pointer"
            style={{ color: "rgba(255,255,255,0.9)" }}
            aria-label="Día siguiente"
          >
            →
          </button>
        </div>
      </div>

      {/* Matches for selected date */}
      {current && (
        <div className="space-y-3 p-4">
          {current.matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictions[match.id]}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
