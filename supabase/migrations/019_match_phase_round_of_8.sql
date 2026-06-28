-- ============================================================
-- 019_match_phase_round_of_8.sql
-- Agrega 'round_of_8' (8vos de final) al enum match_phase.
-- round_of_16 = primera ronda (32 equipos, 16 partidos)
-- round_of_8  = segunda ronda (16 equipos, 8 partidos)
-- ============================================================

ALTER TYPE match_phase ADD VALUE 'round_of_8' AFTER 'round_of_16';
