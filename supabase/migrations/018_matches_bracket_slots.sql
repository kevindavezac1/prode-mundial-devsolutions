-- ============================================================
-- 018_matches_bracket_slots.sql
-- Labels para partidos de eliminatoria cuando el equipo es NULL.
-- home_slot / away_slot: ej. "1ro Grupo A", "Mejor 3ro", "Ganador P73"
-- ============================================================

ALTER TABLE matches
  ADD COLUMN home_slot text,
  ADD COLUMN away_slot text;
