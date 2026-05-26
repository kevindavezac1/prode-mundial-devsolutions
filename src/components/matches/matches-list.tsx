"use client";

import useSWR from "swr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MatchCard } from "./match-card";
import type { MatchWithTeams, Prediction, PredictionsMap } from "@/types/matches";

type Props = { matches: MatchWithTeams[] };

type ApiResponse = { data: PredictionsMap };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TZ = "America/Argentina/Buenos_Aires";

type DateGroup = {
  key: string;
  label: string;
  matches: MatchWithTeams[];
};

function groupByDate(matches: MatchWithTeams[]): DateGroup[] {
  const groups = new Map<string, DateGroup>();

  for (const match of matches) {
    const d = new Date(match.scheduled_at);
    const key = d.toLocaleDateString("es-AR", { timeZone: TZ });
    if (!groups.has(key)) {
      const label = d.toLocaleDateString("es-AR", {
        timeZone: TZ,
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

  const groups = useMemo(() => groupByDate(matches), [matches]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Set default after mount: today in ARG tz, or next upcoming date
  useEffect(() => {
    const todayKey = new Date().toLocaleDateString("es-AR", { timeZone: TZ });
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
  }, [groups]);

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

  return (
    <div>
      {/* Date navigation */}
      <div className="sticky top-[60px] z-10 bg-background/95 backdrop-blur border-b flex items-center px-2 py-2 gap-1">
        <button
          onClick={() => setSelectedIdx((i) => i - 1)}
          disabled={!canPrev}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Día anterior"
        >
          ‹
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm font-semibold capitalize">
            {current?.label ?? "–"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {current ? `${current.matches.length} partido${current.matches.length !== 1 ? "s" : ""}` : ""}
          </p>
        </div>

        <button
          onClick={() => setSelectedIdx((i) => i + 1)}
          disabled={!canNext}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Día siguiente"
        >
          ›
        </button>
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
