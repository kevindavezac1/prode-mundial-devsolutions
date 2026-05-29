export type League = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  max_members: number;
  is_public: boolean;
  created_at: string;
  image_url?: string | null;
  member_count?: number;
};

export type LeagueMember = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  joined_at: string;
};

export type LeagueDetail = League & {
  members: LeagueMember[];
};
