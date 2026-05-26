-- Scoring function called after a match result is saved.
-- Processes ALL predictions (not just pending) so result corrections work.
-- For already-processed predictions: reverts old stats first, then applies new.
-- Idempotent per result: calling twice with the same result yields same totals.
-- security definer so profile updates bypass RLS.

create or replace function calculate_match_points(p_match_id int)
returns int
language plpgsql
security definer
as $$
declare
  v_home_score  smallint;
  v_away_score  smallint;
  v_actual_dir  text;
  v_pred        record;
  v_pred_dir    text;
  v_new_outcome text;
  v_new_points  smallint;
  v_count       int := 0;
begin
  select home_score, away_score into v_home_score, v_away_score
  from matches where id = p_match_id;

  if v_home_score is null then
    raise exception 'Match % has no result', p_match_id;
  end if;

  if    v_home_score > v_away_score then v_actual_dir := 'home';
  elsif v_home_score < v_away_score then v_actual_dir := 'away';
  else  v_actual_dir := 'draw';
  end if;

  for v_pred in
    select id, user_id, home_score, away_score, outcome, points_earned
    from predictions
    where match_id = p_match_id
  loop
    if    v_pred.home_score > v_pred.away_score then v_pred_dir := 'home';
    elsif v_pred.home_score < v_pred.away_score then v_pred_dir := 'away';
    else  v_pred_dir := 'draw';
    end if;

    if v_pred.home_score = v_home_score and v_pred.away_score = v_away_score then
      v_new_outcome := 'exact';     v_new_points := 3;
    elsif v_pred_dir = v_actual_dir then
      v_new_outcome := 'correct';   v_new_points := 1;
    else
      v_new_outcome := 'incorrect'; v_new_points := 0;
    end if;

    -- Revert previously awarded stats before applying new result
    if v_pred.outcome != 'pending' then
      update profiles set
        total_points        = total_points        - v_pred.points_earned,
        exact_predictions   = exact_predictions   - case when v_pred.outcome = 'exact'              then 1 else 0 end,
        correct_predictions = correct_predictions - case when v_pred.outcome in ('exact','correct') then 1 else 0 end,
        total_predictions   = total_predictions   - 1,
        updated_at = now()
      where id = v_pred.user_id;
    end if;

    update predictions set
      outcome       = v_new_outcome::prediction_outcome,
      points_earned = v_new_points,
      updated_at    = now()
    where id = v_pred.id;

    update profiles set
      total_points        = total_points        + v_new_points,
      exact_predictions   = exact_predictions   + case when v_new_outcome = 'exact'              then 1 else 0 end,
      correct_predictions = correct_predictions + case when v_new_outcome in ('exact','correct') then 1 else 0 end,
      total_predictions   = total_predictions   + 1,
      updated_at = now()
    where id = v_pred.user_id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
