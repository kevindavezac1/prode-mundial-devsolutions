export type Team = {
  id: number;
  name: string;
  code: string;
  flag_url: string | null;
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
  home_team: Team;
  away_team: Team;
};

export type Prediction = {
  id: number;
  match_id: number;
  home_score: number;
  away_score: number;
  outcome: "exact" | "correct" | "incorrect" | "pending";
  points_earned: number;
};

export type PredictionsMap = Record<number, Prediction>;
