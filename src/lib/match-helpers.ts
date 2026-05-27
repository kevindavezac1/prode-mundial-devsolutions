/**
 * match-helpers.ts
 * Pure timing/state helpers for match display logic.
 * No React dependencies. All functions accept `now` as optional param
 * for testability and to avoid hydration issues.
 */

import type { MatchWithTeams, Prediction } from "@/types/matches";

// Minimal structural type — compatible with MatchWithTeams (and any superset)
export type MatchTimingInput = {
  scheduled_at: string;
  status: "scheduled" | "live" | "finished" | "cancelled";
};

export type UserPredictionInput =
  | Pick<Prediction, "home_score" | "away_score">
  | null
  | undefined;

const LOCK_OFFSET_MS = 5 * 60 * 1000; // 5 minutes

/**
 * isLive — derived from time. True if past kickoff and not finished.
 * Also true if DB status is already "live" (cron may have set it).
 */
export function isLive(
  match: MatchTimingInput,
  now: Date = new Date()
): boolean {
  if (match.status === "live") return true;
  const scheduled = new Date(match.scheduled_at);
  return (
    now.getTime() > scheduled.getTime() && match.status !== "finished"
  );
}

/**
 * isLocked — predictions disabled 5 minutes before kickoff.
 * Mirrors backend validation in /api/predictions (read-only replica).
 */
export function isLocked(
  match: MatchTimingInput,
  now: Date = new Date()
): boolean {
  const scheduled = new Date(match.scheduled_at);
  return now.getTime() >= scheduled.getTime() - LOCK_OFFSET_MS;
}

export function isFinished(match: MatchTimingInput): boolean {
  return match.status === "finished";
}

// ─── Visual state ─────────────────────────────────────────────────────────────

export type MatchVisualState =
  | "upcoming-unpredicted"
  | "upcoming-predicted"
  | "locked-unpredicted"
  | "live"
  | "finished";

export function getMatchState(
  match: MatchTimingInput,
  userPrediction: UserPredictionInput,
  now: Date = new Date()
): MatchVisualState {
  if (isFinished(match)) return "finished";
  if (isLive(match, now)) return "live";
  const hasPrediction = !!userPrediction;
  if (isLocked(match, now)) {
    return hasPrediction ? "upcoming-predicted" : "locked-unpredicted";
  }
  return hasPrediction ? "upcoming-predicted" : "upcoming-unpredicted";
}

// ─── Feed filter ──────────────────────────────────────────────────────────────

/**
 * belongsToTodayFeed — filter for /dashboard "Hoy" tab.
 * Rules:
 *  - Same calendar day as `now`
 *  - finished + no prediction → goes to Resultados tab, not Hoy
 */
export function belongsToTodayFeed(
  match: MatchTimingInput,
  userPrediction: UserPredictionInput,
  now: Date = new Date()
): boolean {
  const scheduled = new Date(match.scheduled_at);
  const sameDay =
    scheduled.getFullYear() === now.getFullYear() &&
    scheduled.getMonth() === now.getMonth() &&
    scheduled.getDate() === now.getDate();

  if (!sameDay) return false;

  const state = getMatchState(match, userPrediction, now);
  if (state === "finished" && !userPrediction) return false;

  return true;
}

// Re-export MatchWithTeams for convenience so callers don't need two imports
export type { MatchWithTeams };
