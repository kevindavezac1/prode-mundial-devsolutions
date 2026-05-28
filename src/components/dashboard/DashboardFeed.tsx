"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { MatchCard } from "@/components/match/MatchCard";
import { PredictionSheet } from "@/components/match/PredictionSheet";
import { isFinished, isLive, getMatchState } from "@/lib/match-helpers";
import type { MatchWithTeams, Prediction } from "@/types/matches";
import type { PredictionSheetMatch, PredictionSheetExisting } from "@/components/match/PredictionSheet";

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchWithPrediction = MatchWithTeams & {
  userPrediction: Prediction | null;
};

type FeedResponse = { data: MatchWithPrediction[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TZ = "America/Argentina/Buenos_Aires";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch error");
    return r.json();
  });

function isSameDayARG(a: Date, b: Date): boolean {
  const fmt = (d: Date) => d.toLocaleDateString("es-AR", { timeZone: TZ });
  return fmt(a) === fmt(b);
}

function formatDateLabel(date: Date): string {
  return date
    .toLocaleDateString("es-AR", {
      timeZone: TZ,
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4 mb-3 animate-pulse overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0d1120 0%, #07090f 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex justify-between mb-4">
        <div className="h-3 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="h-3 w-14 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
      <div className="flex justify-between items-center px-2 py-3">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-2 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-12 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="w-10 h-12 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-2 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      </div>
      <div className="h-10 rounded-xl mt-4" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="text-center py-12 text-sm px-4"
      style={{ color: "rgba(255,255,255,0.3)" }}
    >
      {message}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type Props = { displayName: string };

export function DashboardFeed({ displayName }: Props) {
  const { data: response, error, isLoading, mutate } =
    useSWR<FeedResponse>("/api/matches/feed", fetcher);

  const [sheetState, setSheetState] = useState<{
    match: PredictionSheetMatch;
    prediction: PredictionSheetExisting;
  } | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const matches = response?.data ?? [];
  const now = useMemo(() => new Date(), []);

  // ─── All unique days with matches, sorted chronologically ─────────────────

  const allDates = useMemo(() => {
    const sorted = [...matches].sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
    const unique: Date[] = [];
    for (const m of sorted) {
      const d = new Date(m.scheduled_at);
      if (!unique.some((u) => isSameDayARG(u, d))) unique.push(d);
    }
    return unique;
  }, [matches]);

  // ─── Default day: today if it has matches; otherwise nearest day ───────────

  const initialDayIndex = useMemo(() => {
    if (allDates.length === 0) return 0;
    const todayIdx = allDates.findIndex((d) => isSameDayARG(d, now));
    if (todayIdx !== -1) return todayIdx;
    // Nearest day by absolute time difference
    let nearest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < allDates.length; i++) {
      const diff = Math.abs(allDates[i].getTime() - now.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        nearest = i;
      }
    }
    return nearest;
  }, [allDates, now]);

  const effectiveDayIndex = selectedDayIndex ?? initialDayIndex;
  const selectedDate = allDates[effectiveDayIndex] ?? null;
  const isSelectedToday = selectedDate ? isSameDayARG(selectedDate, now) : false;

  // ─── Matches for selected day: finished → live → pending ─────────────────

  const matchesForDay = useMemo(() => {
    if (!selectedDate) return [];
    const day = matches.filter((m) =>
      isSameDayARG(new Date(m.scheduled_at), selectedDate)
    );
    const byTime = (a: MatchWithPrediction, b: MatchWithPrediction) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    const finished = day.filter((m) => isFinished(m)).sort(byTime);
    const live = day.filter((m) => !isFinished(m) && isLive(m, now)).sort(byTime);
    const pending = day.filter((m) => !isFinished(m) && !isLive(m, now)).sort(byTime);
    return [...finished, ...live, ...pending];
  }, [matches, selectedDate, now]);

  // ─── Greeting: pending count always for today ────────────────────────────

  const hasTodayMatches = useMemo(
    () => matches.some((m) => isSameDayARG(new Date(m.scheduled_at), now)),
    [matches, now]
  );

  const pendingTodayCount = useMemo(() => {
    if (!hasTodayMatches) return 0;
    return matches
      .filter((m) => isSameDayARG(new Date(m.scheduled_at), now))
      .filter((m) => getMatchState(m, m.userPrediction, now) === "upcoming-unpredicted")
      .length;
  }, [matches, now, hasTodayMatches]);

  // ─── Sheet handlers ───────────────────────────────────────────────────────

  function openSheet(m: MatchWithPrediction) {
    setSheetState({
      match: {
        id: m.id,
        scheduled_at: m.scheduled_at,
        home_team: m.home_team,
        away_team: m.away_team,
      },
      prediction: m.userPrediction
        ? { home_score: m.userPrediction.home_score, away_score: m.userPrediction.away_score }
        : null,
    });
  }

  function renderMatchList(list: MatchWithPrediction[]) {
    return list.map((m) => (
      <MatchCard
        key={m.id}
        match={m}
        userPrediction={
          m.userPrediction
            ? {
                home_score: m.userPrediction.home_score,
                away_score: m.userPrediction.away_score,
                points_earned: m.userPrediction.points_earned ?? null,
              }
            : null
        }
        onPredictClick={() => openSheet(m)}
      />
    ));
  }

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (isLoading && !response) {
    return (
      <div className="min-h-screen px-4 pt-4" style={{ background: "#07090f" }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 px-4"
        style={{ background: "#07090f" }}
      >
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
          No pudimos cargar los partidos.
        </p>
        <button onClick={() => mutate()} className="text-wc-red font-bold text-sm underline">
          Reintentar
        </button>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "#07090f" }}>

      {/* Greeting strip */}
      <div
        className="px-4 py-5"
        style={{
          background: "linear-gradient(180deg, #0a1428 0%, #07090f 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <p className="font-bold text-lg text-white">Hola, {displayName} 👋</p>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          {!hasTodayMatches ? (
            "Sin partidos hoy — navegá para ver otros días"
          ) : pendingTodayCount === 0 ? (
            "No tenés partidos pendientes hoy"
          ) : pendingTodayCount === 1 ? (
            <>
              Tenés <span className="text-wc-red font-bold">1 partido</span> para predecir hoy
            </>
          ) : (
            <>
              Tenés{" "}
              <span className="text-wc-red font-bold">{pendingTodayCount} partidos</span>{" "}
              para predecir hoy
            </>
          )}
        </p>
      </div>

      {/* Date navigator */}
      {allDates.length > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => setSelectedDayIndex(Math.max(0, effectiveDayIndex - 1))}
            disabled={effectiveDayIndex === 0}
            style={{
              color:
                effectiveDayIndex === 0
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.6)",
              fontSize: "22px",
              lineHeight: 1,
              padding: "4px 10px",
              cursor: effectiveDayIndex === 0 ? "default" : "pointer",
            }}
          >
            ‹
          </button>

          <div className="flex flex-col items-center gap-0.5">
            {isSelectedToday && (
              <span
                className="text-[9px] font-bold tracking-widest"
                style={{ color: "#E4002B" }}
              >
                HOY
              </span>
            )}
            <span
              className="font-bold text-[11px] text-center"
              style={{ color: "rgba(255,255,255,0.75)", letterSpacing: "1.5px" }}
            >
              {selectedDate ? formatDateLabel(selectedDate) : ""}
            </span>
          </div>

          <button
            onClick={() =>
              setSelectedDayIndex(Math.min(allDates.length - 1, effectiveDayIndex + 1))
            }
            disabled={effectiveDayIndex === allDates.length - 1}
            style={{
              color:
                effectiveDayIndex === allDates.length - 1
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.6)",
              fontSize: "22px",
              lineHeight: 1,
              padding: "4px 10px",
              cursor:
                effectiveDayIndex === allDates.length - 1 ? "default" : "pointer",
            }}
          >
            ›
          </button>
        </div>
      )}

      {/* Match list */}
      <div className="px-4 pt-4 pb-4">
        {matchesForDay.length === 0 ? (
          <EmptyState message="No hay partidos este día." />
        ) : (
          renderMatchList(matchesForDay)
        )}
      </div>

      {/* Prediction sheet */}
      <PredictionSheet
        match={sheetState?.match ?? null}
        existingPrediction={sheetState?.prediction ?? null}
        open={!!sheetState}
        onOpenChange={(open) => {
          if (!open) setSheetState(null);
        }}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
