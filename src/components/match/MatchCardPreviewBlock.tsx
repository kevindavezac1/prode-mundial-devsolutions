"use client";

import { useState } from "react";
import { MatchCard } from "@/components/match/MatchCard";
import { PredictionSheet } from "@/components/match/PredictionSheet";
import type { MatchCardMatch, MatchCardPrediction } from "@/components/match/MatchCard";
import type { PredictionSheetMatch, PredictionSheetExisting } from "@/components/match/PredictionSheet";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const ARG = { name: "Argentina", code: "AR", flag_url: null };
const BRA = { name: "Brasil",    code: "BR", flag_url: null };
const MEX = { name: "México",    code: "MX", flag_url: null };
const CAN = { name: "Canadá",    code: "CA", flag_url: null };
const ESP = { name: "España",    code: "ES", flag_url: null };
const FRA = { name: "Francia",   code: "FR", flag_url: null };
const ALE = { name: "Alemania",  code: "DE", flag_url: null };

const mockMatchUpcomingUnpredicted: MatchCardMatch = {
  id: 1, home_team: ARG, away_team: BRA,
  scheduled_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  status: "scheduled", home_score: null, away_score: null, group_name: "Grupo A",
};
const mockMatchUpcomingPredicted: MatchCardMatch = {
  id: 2, home_team: MEX, away_team: CAN,
  scheduled_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
  status: "scheduled", home_score: null, away_score: null, group_name: "Grupo B",
};
const mockMatchLockedUnpredicted: MatchCardMatch = {
  id: 3, home_team: ESP, away_team: FRA,
  scheduled_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
  status: "scheduled", home_score: null, away_score: null, group_name: "Grupo C",
};
const mockMatchLive: MatchCardMatch = {
  id: 4, home_team: ARG, away_team: MEX,
  scheduled_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  status: "live", home_score: 1, away_score: 0, group_name: "Grupo A",
};
const mockMatchFinishedWith300: MatchCardMatch = {
  id: 5, home_team: BRA, away_team: CAN,
  scheduled_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  status: "finished", home_score: 2, away_score: 1, group_name: "Grupo B",
};
const mockMatchFinishedWith100: MatchCardMatch = {
  id: 6, home_team: FRA, away_team: ALE,
  scheduled_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  status: "finished", home_score: 3, away_score: 1, group_name: "Grupo C",
};
const mockMatchFinishedWith0: MatchCardMatch = {
  id: 7, home_team: ESP, away_team: ARG,
  scheduled_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  status: "finished", home_score: 0, away_score: 2, group_name: "Grupo D",
};

type SheetState = {
  match: PredictionSheetMatch;
  prediction: PredictionSheetExisting;
} | null;

// ─── Component ────────────────────────────────────────────────────────────────

export function MatchCardPreviewBlock() {
  const [sheetState, setSheetState] = useState<SheetState>(null);

  function openSheet(match: MatchCardMatch, prediction: MatchCardPrediction) {
    setSheetState({
      match: {
        id: match.id,
        scheduled_at: match.scheduled_at,
        phase: match.phase ?? "group",
        home_team: match.home_team!,
        away_team: match.away_team!,
      },
      prediction: prediction
        ? { home_score: prediction.home_score, away_score: prediction.away_score }
        : null,
    });
  }

  return (
    <div className="mt-8 space-y-1">
      <h2 className="font-bold text-wc-navy mb-4">Preview MatchCard (temporal)</h2>

      <MatchCard
        match={mockMatchUpcomingUnpredicted}
        userPrediction={null}
        onPredictClick={() => openSheet(mockMatchUpcomingUnpredicted, null)}
      />
      <MatchCard
        match={mockMatchUpcomingPredicted}
        userPrediction={{ home_score: 2, away_score: 1 }}
        onPredictClick={() => openSheet(mockMatchUpcomingPredicted, { home_score: 2, away_score: 1 })}
      />
      <MatchCard
        match={mockMatchLockedUnpredicted}
        userPrediction={null}
      />
      <MatchCard
        match={mockMatchLive}
        userPrediction={{ home_score: 2, away_score: 1 }}
      />
      <MatchCard
        match={mockMatchFinishedWith300}
        userPrediction={{ home_score: 2, away_score: 1, points_earned: 300 }}
      />
      <MatchCard
        match={mockMatchFinishedWith100}
        userPrediction={{ home_score: 2, away_score: 0, points_earned: 100 }}
      />
      <MatchCard
        match={mockMatchFinishedWith0}
        userPrediction={{ home_score: 0, away_score: 3, points_earned: 0 }}
      />

      <PredictionSheet
        match={sheetState?.match ?? null}
        existingPrediction={sheetState?.prediction ?? null}
        open={!!sheetState}
        onOpenChange={(o) => { if (!o) setSheetState(null); }}
        onSuccess={() => {
          console.log("Predicción guardada");
          // En Prompt 6: router.refresh() o mutate() según el patrón del feed
        }}
      />
    </div>
  );
}
