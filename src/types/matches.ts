export type Team = {
  id: number;
  name: string;
  code: string;
  flag_url: string | null;
  group_name?: string | null;
};

export type MatchWithTeams = {
  id: number;
  match_number: number;
  phase: string;
  scheduled_at: string;
  venue: string | null;
  status: "scheduled" | "live" | "finished" | "cancelled";
  home_score: number | null;
  away_score: number | null;
  penalty_winner?: string | null;
  home_slot?: string | null;
  away_slot?: string | null;
  home_team: Team | null;
  away_team: Team | null;
};

export type Prediction = {
  id: number;
  match_id: number;
  home_score: number;
  away_score: number;
  outcome: "exact" | "correct" | "incorrect" | "pending";
  points_earned: number;
  predicted_penalty_winner?: "home" | "away" | null;
};

export type PredictionsMap = Record<number, Prediction>;
