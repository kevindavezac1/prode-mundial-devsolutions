"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { MatchCard } from "@/components/match/MatchCard";
import { PredictionSheet } from "@/components/match/PredictionSheet";
import { TeamPicker } from "@/components/dashboard/TeamPicker";
import { FlagEmoji } from "@/components/match/FlagEmoji";
import { isFinished, isLive, getMatchState } from "@/lib/match-helpers";
import type { MatchWithTeams, Prediction, Team } from "@/types/matches";
import type { PredictionSheetMatch, PredictionSheetExisting } from "@/components/match/PredictionSheet";
import { SponsorsCarousel } from "@/components/sponsors/SponsorsCarousel";

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchWithPrediction = MatchWithTeams & {
  userPrediction: Prediction | null;
};

type FeedResponse = { data: MatchWithPrediction[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch error");
    return r.json();
  });

function isSameDayTZ(a: Date, b: Date, tz: string): boolean {
  const fmt = (d: Date) => d.toLocaleDateString("es-AR", { timeZone: tz });
  return fmt(a) === fmt(b);
}

function formatDateLabel(date: Date, tz: string): string {
  return date
    .toLocaleDateString("es-AR", {
      timeZone: tz,
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
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const localTZ = "America/Argentina/Buenos_Aires";
  const [hasSponsors, setHasSponsors] = useState(false);

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
      if (!unique.some((u) => isSameDayTZ(u, d, localTZ))) unique.push(d);
    }
    return unique;
  }, [matches, localTZ]);

  // ─── Default day: today if it has matches; otherwise nearest day ───────────

  const initialDayIndex = useMemo(() => {
    if (allDates.length === 0) return 0;
    const todayIdx = allDates.findIndex((d) => isSameDayTZ(d, now, localTZ));
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
  }, [allDates, now, localTZ]);

  const effectiveDayIndex = selectedDayIndex ?? initialDayIndex;
  const selectedDate = allDates[effectiveDayIndex] ?? null;
  const isSelectedToday = selectedDate ? isSameDayTZ(selectedDate, now, localTZ) : false;

  // ─── Matches for selected day: finished → live → pending ─────────────────

  const matchesForDay = useMemo(() => {
    if (!selectedDate) return [];
    const day = matches.filter((m) =>
      isSameDayTZ(new Date(m.scheduled_at), selectedDate, localTZ)
    );
    const byTime = (a: MatchWithPrediction, b: MatchWithPrediction) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    const finished = day.filter((m) => isFinished(m)).sort(byTime);
    const live = day.filter((m) => !isFinished(m) && isLive(m, now)).sort(byTime);
    const pending = day.filter((m) => !isFinished(m) && !isLive(m, now)).sort(byTime);
    return [...finished, ...live, ...pending];
  }, [matches, selectedDate, now, localTZ]);

  // ─── All unique teams extracted from feed ────────────────────────────────

  const allTeams = useMemo(() => {
    const map = new Map<number, Team>();
    for (const m of matches) {
      map.set(m.home_team.id, m.home_team);
      map.set(m.away_team.id, m.away_team);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [matches]);

  // ─── Matches for selected team ────────────────────────────────────────────

  const matchesForTeam = useMemo(() => {
    if (!selectedTeam) return [];
    return [...matches]
      .filter(
        (m) =>
          m.home_team.id === selectedTeam.id ||
          m.away_team.id === selectedTeam.id
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
  }, [matches, selectedTeam]);

  // ─── Greeting: pending count always for today ────────────────────────────

  const hasTodayMatches = useMemo(
    () => matches.some((m) => isSameDayTZ(new Date(m.scheduled_at), now, localTZ)),
    [matches, now, localTZ]
  );

  const pendingTodayCount = useMemo(() => {
    if (!hasTodayMatches) return 0;
    return matches
      .filter((m) => isSameDayTZ(new Date(m.scheduled_at), now, localTZ))
      .filter((m) => getMatchState(m, m.userPrediction, now) === "upcoming-unpredicted")
      .length;
  }, [matches, now, hasTodayMatches, localTZ]);

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

      <SponsorsCarousel onHasSponsors={setHasSponsors} />

      {hasSponsors && (
        <p className="text-center text-xs pb-1" style={{ color: "rgba(255,255,255,0.2)" }}>
          ¿Querés ser patrocinador? →{" "}
          <a
            href="https://www.instagram.com/devsolutions.it?igsh=dmhlcjZscDVwZG8x&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium"
            style={{ color: "rgba(212,175,55,0.6)" }}
          >
            DevSolutions
          </a>
        </p>
      )}

      {/* Team filter bar */}
      <div
        className="px-4 py-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {selectedTeam ? (
          <div className="flex items-center gap-2">
            <FlagEmoji
              code={selectedTeam.code}
              flagUrl={selectedTeam.flag_url}
              className="w-6 h-6 rounded-full object-cover object-center shrink-0"
              alt={selectedTeam.name}
            />
            <span className="text-sm font-semibold text-white flex-1 truncate">
              {selectedTeam.name}
            </span>
            <button
              onClick={() => setSelectedTeam(null)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg shrink-0"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}
            >
              ✕ Quitar filtro
            </button>
          </div>
        ) : (
          <button
            onClick={() => setTeamPickerOpen(true)}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl w-full transition-all active:scale-[0.98]"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            <span>⚽</span>
            <span className="flex-1 text-left">Todos los equipos</span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px" }}>▾</span>
          </button>
        )}
      </div>

      {/* Date navigator */}
      {!selectedTeam && allDates.length > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-3"
          style={{
            borderBottom: "2px solid rgba(255,255,255,0.12)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
            background: "rgba(7,9,15,0.97)",
          }}
        >
          <button
            onClick={() => setSelectedDayIndex(Math.max(0, effectiveDayIndex - 1))}
            disabled={effectiveDayIndex === 0}
            className="w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 hover:bg-white/10 disabled:pointer-events-none"
            style={{
              color: effectiveDayIndex === 0 ? "rgba(255,255,255,0.2)" : "#FFFFFF",
              fontSize: "24px",
              lineHeight: 1,
            }}
          >
            ←
          </button>

          <div className="flex-1 flex flex-col items-center gap-0.5">
            {isSelectedToday && (
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: "#E4002B" }}
              >
                HOY
              </span>
            )}
            <span
              className="font-bold text-sm text-center"
              style={{ color: "#FFFFFF", letterSpacing: "1px" }}
            >
              {selectedDate ? formatDateLabel(selectedDate, localTZ) : ""}
            </span>
            <span
              className="text-[10px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {effectiveDayIndex + 1} / {allDates.length}
            </span>
          </div>

          <button
            onClick={() =>
              setSelectedDayIndex(Math.min(allDates.length - 1, effectiveDayIndex + 1))
            }
            disabled={effectiveDayIndex === allDates.length - 1}
            className="w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 hover:bg-white/10 disabled:pointer-events-none"
            style={{
              color: effectiveDayIndex === allDates.length - 1 ? "rgba(255,255,255,0.2)" : "#FFFFFF",
              fontSize: "24px",
              lineHeight: 1,
            }}
          >
            →
          </button>
        </div>
      )}

      {/* Match list */}
      <div className="px-4 pt-4 pb-4">
        {selectedTeam ? (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <FlagEmoji
                code={selectedTeam.code}
                flagUrl={selectedTeam.flag_url}
                className="w-9 h-9 rounded-full object-cover object-center shrink-0"
                alt={selectedTeam.name}
              />
              <div>
                <p className="text-sm font-bold text-white">Partidos de {selectedTeam.name}</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {matchesForTeam.length} partido{matchesForTeam.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {matchesForTeam.length === 0 ? (
              <EmptyState message="No hay partidos para este equipo." />
            ) : (
              renderMatchList(matchesForTeam)
            )}
          </>
        ) : matchesForDay.length === 0 ? (
          <EmptyState message="No hay partidos este día." />
        ) : (
          renderMatchList(matchesForDay)
        )}
      </div>

      {/* Team picker overlay */}
      {teamPickerOpen && (
        <TeamPicker
          teams={allTeams}
          search={teamSearch}
          onSearchChange={setTeamSearch}
          onSelect={(team) => {
            setSelectedTeam(team);
            setTeamPickerOpen(false);
            setTeamSearch("");
          }}
          onClose={() => {
            setTeamPickerOpen(false);
            setTeamSearch("");
          }}
        />
      )}

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
