"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MatchCard } from "@/components/match/MatchCard";
import { PredictionSheet } from "@/components/match/PredictionSheet";
import { belongsToTodayFeed, isFinished, getMatchState } from "@/lib/match-helpers";
import type { MatchWithTeams, Prediction } from "@/types/matches";
import type { PredictionSheetMatch, PredictionSheetExisting } from "@/components/match/PredictionSheet";

// ─── Types (sin cambios) ──────────────────────────────────────────────────────

type MatchWithPrediction = MatchWithTeams & {
  userPrediction: Prediction | null;
};

type FeedResponse = { data: MatchWithPrediction[] };

// ─── Helpers (sin cambios) ────────────────────────────────────────────────────

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
  const [upcomingDayIndex, setUpcomingDayIndex] = useState(0);

  const matches = response?.data ?? [];
  const now = useMemo(() => new Date(), []);

  // ─── Feed segmentation (lógica sin cambios) ──────────────────────────────

  const todayMatches = useMemo(
    () =>
      matches
        .filter((m) => belongsToTodayFeed(m, m.userPrediction, now))
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [matches, now]
  );

  // Fechas únicas futuras (sin hoy, sin terminados), ordenadas
  const futureDates = useMemo(() => {
    const future = matches
      .filter((m) => {
        const scheduled = new Date(m.scheduled_at);
        return !isSameDayARG(scheduled, now) && scheduled > now && !isFinished(m);
      })
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    const unique: Date[] = [];
    for (const m of future) {
      const d = new Date(m.scheduled_at);
      if (!unique.some((u) => isSameDayARG(u, d))) unique.push(d);
    }
    return unique;
  }, [matches, now]);

  const upcomingMatches = useMemo(() => {
    const date = futureDates[upcomingDayIndex];
    if (!date) return [];
    return matches
      .filter((m) => isSameDayARG(new Date(m.scheduled_at), date) && !isFinished(m))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [matches, futureDates, upcomingDayIndex]);

  const finishedMatches = useMemo(
    () =>
      matches
        .filter((m) => isFinished(m))
        .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()),
    [matches]
  );

  const pendingTodayCount = useMemo(
    () =>
      todayMatches.filter(
        (m) => getMatchState(m, m.userPrediction, now) === "upcoming-unpredicted"
      ).length,
    [todayMatches, now]
  );

  // ─── Sheet handlers (sin cambios) ────────────────────────────────────────

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
      <div
        className="min-h-screen px-4 pt-4"
        style={{ background: "#07090f" }}
      >
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
        <button
          onClick={() => mutate()}
          className="text-wc-red font-bold text-sm underline"
        >
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
        <p className="font-bold text-lg text-white">
          Hola, {displayName} 👋
        </p>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          {pendingTodayCount === 0 ? (
            "No tenés partidos pendientes hoy"
          ) : pendingTodayCount === 1 ? (
            <>
              Tenés{" "}
              <span className="text-wc-red font-bold">1 partido</span>{" "}
              para predecir hoy
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

      {/* Tabs */}
      <Tabs defaultValue="hoy" className="flex flex-col w-full">
        <TabsList
          variant="line"
          className="flex w-full rounded-none h-auto px-0 gap-0 justify-start"
          style={{
            background: "#07090f",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {(
            [
              { value: "hoy",        label: "HOY" },
              { value: "proximos",   label: "PRÓXIMOS" },
              { value: "resultados", label: "RESULTADOS" },
            ] as const
          ).map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 py-3 px-2 rounded-none border-0 font-bold text-[11px] tracking-wider transition-colors data-active:text-white after:!bg-wc-red"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="hoy">
          <div className="px-4 pt-4 pb-4">
            {todayMatches.length === 0 ? (
              <EmptyState message="🏖️ No hay partidos hoy. Volvé mañana." />
            ) : (
              renderMatchList(todayMatches)
            )}
          </div>
        </TabsContent>

        <TabsContent value="proximos">
          {futureDates.length > 0 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <button
                onClick={() => setUpcomingDayIndex((i) => Math.max(0, i - 1))}
                disabled={upcomingDayIndex === 0}
                style={{
                  color: upcomingDayIndex === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
                  fontSize: "18px",
                  lineHeight: 1,
                  padding: "4px 8px",
                  cursor: upcomingDayIndex === 0 ? "default" : "pointer",
                }}
              >
                ‹
              </button>
              <span
                className="font-bold text-xs text-center"
                style={{ color: "rgba(255,255,255,0.7)", letterSpacing: "2px" }}
              >
                {futureDates[upcomingDayIndex]
                  ?.toLocaleDateString("es-AR", {
                    timeZone: TZ,
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                  .toUpperCase()}
              </span>
              <button
                onClick={() => setUpcomingDayIndex((i) => Math.min(futureDates.length - 1, i + 1))}
                disabled={upcomingDayIndex === futureDates.length - 1}
                style={{
                  color: upcomingDayIndex === futureDates.length - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
                  fontSize: "18px",
                  lineHeight: 1,
                  padding: "4px 8px",
                  cursor: upcomingDayIndex === futureDates.length - 1 ? "default" : "pointer",
                }}
              >
                ›
              </button>
            </div>
          )}
          <div className="px-4 pt-4 pb-4">
            {upcomingMatches.length === 0 ? (
              <EmptyState message="Ya jugaste todos los partidos disponibles." />
            ) : (
              renderMatchList(upcomingMatches)
            )}
          </div>
        </TabsContent>

        <TabsContent value="resultados">
          <div className="px-4 pt-4 pb-4">
            {finishedMatches.length === 0 ? (
              <EmptyState message="El Mundial todavía no arrancó." />
            ) : (
              renderMatchList(finishedMatches)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Prediction sheet */}
      <PredictionSheet
        match={sheetState?.match ?? null}
        existingPrediction={sheetState?.prediction ?? null}
        open={!!sheetState}
        onOpenChange={(open) => { if (!open) setSheetState(null); }}
        onSuccess={() => mutate()}
      />
    </div>
  );
}