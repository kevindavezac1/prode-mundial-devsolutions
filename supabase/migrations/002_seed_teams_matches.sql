-- ============================================================
-- 002_seed_teams_matches.sql — Prode Mundial 2026
-- Fuentes: wikipedia.org/wiki/2026_FIFA_World_Cup_draw
--          sportsbrackets.net (fixture oficial)
-- Formato: 12 grupos de 4 equipos, 72 partidos grupales
-- Horarios: convertidos de ET (EDT = UTC-4)
-- VERIFICAR: M59 (10PM ET anómalo), M60 (ordering vs M59)
-- ============================================================

-- Limpiar datos de prueba anteriores
DELETE FROM predictions WHERE match_id IN (SELECT id FROM matches);
DELETE FROM matches;
DELETE FROM teams;

-- ─── 48 EQUIPOS ──────────────────────────────────────────────
INSERT INTO teams (name, code, flag_url, group_name) VALUES
-- Grupo A
('México',              'MEX', NULL, 'A'),
('Sudáfrica',           'RSA', NULL, 'A'),
('Corea del Sur',       'KOR', NULL, 'A'),
('República Checa',     'CZE', NULL, 'A'),
-- Grupo B
('Canadá',              'CAN', NULL, 'B'),
('Bosnia y Herzegovina','BIH', NULL, 'B'),
('Qatar',               'QAT', NULL, 'B'),
('Suiza',               'SUI', NULL, 'B'),
-- Grupo C
('Brasil',              'BRA', NULL, 'C'),
('Marruecos',           'MAR', NULL, 'C'),
('Haití',               'HAI', NULL, 'C'),
('Escocia',             'SCO', NULL, 'C'),
-- Grupo D
('Estados Unidos',      'USA', NULL, 'D'),
('Paraguay',            'PAR', NULL, 'D'),
('Australia',           'AUS', NULL, 'D'),
('Turquía',             'TUR', NULL, 'D'),
-- Grupo E
('Alemania',            'GER', NULL, 'E'),
('Curazao',             'CUW', NULL, 'E'),
('Costa de Marfil',     'CIV', NULL, 'E'),
('Ecuador',             'ECU', NULL, 'E'),
-- Grupo F
('Países Bajos',        'NED', NULL, 'F'),
('Japón',               'JPN', NULL, 'F'),
('Suecia',              'SWE', NULL, 'F'),
('Túnez',               'TUN', NULL, 'F'),
-- Grupo G
('Bélgica',             'BEL', NULL, 'G'),
('Egipto',              'EGY', NULL, 'G'),
('Irán',                'IRN', NULL, 'G'),
('Nueva Zelanda',       'NZL', NULL, 'G'),
-- Grupo H
('España',              'ESP', NULL, 'H'),
('Cabo Verde',          'CPV', NULL, 'H'),
('Arabia Saudita',      'KSA', NULL, 'H'),
('Uruguay',             'URU', NULL, 'H'),
-- Grupo I
('Francia',             'FRA', NULL, 'I'),
('Senegal',             'SEN', NULL, 'I'),
('Irak',                'IRQ', NULL, 'I'),
('Noruega',             'NOR', NULL, 'I'),
-- Grupo J
('Argentina',           'ARG', NULL, 'J'),
('Argelia',             'ALG', NULL, 'J'),
('Austria',             'AUT', NULL, 'J'),
('Jordania',            'JOR', NULL, 'J'),
-- Grupo K
('Portugal',            'POR', NULL, 'K'),
('R.D. Congo',          'COD', NULL, 'K'),
('Uzbekistán',          'UZB', NULL, 'K'),
('Colombia',            'COL', NULL, 'K'),
-- Grupo L
('Inglaterra',          'ENG', NULL, 'L'),
('Croacia',             'CRO', NULL, 'L'),
('Ghana',               'GHA', NULL, 'L'),
('Panamá',              'PAN', NULL, 'L');

-- ─── 72 PARTIDOS DE FASE DE GRUPOS ───────────────────────────
INSERT INTO matches (match_number, phase, home_team_id, away_team_id, scheduled_at, venue, status)
SELECT
    v.mn::smallint,
    'group'::match_phase,
    h.id,
    a.id,
    v.sat::timestamptz,
    v.venue,
    'scheduled'::match_status
FROM (VALUES
    -- ── RONDA 1 (Jun 11–17) ──────────────────────────────────
    -- Grupo A
    ( 1,'MEX','RSA','2026-06-11 19:00:00+00','Estadio Azteca, Ciudad de México'),
    ( 2,'KOR','CZE','2026-06-12 02:00:00+00','Estadio Akron, Guadalajara'),
    -- Grupo B
    ( 3,'CAN','BIH','2026-06-12 19:00:00+00','BMO Field, Toronto'),
    ( 8,'QAT','SUI','2026-06-14 01:00:00+00','Levi''s Stadium, Santa Clara'),
    -- Grupo C
    ( 5,'BRA','MAR','2026-06-13 16:00:00+00','Gillette Stadium, Foxborough'),
    ( 6,'HAI','SCO','2026-06-13 19:00:00+00','MetLife Stadium, East Rutherford'),
    -- Grupo D
    ( 4,'USA','PAR','2026-06-13 01:00:00+00','SoFi Stadium, Los Angeles'),
    ( 7,'AUS','TUR','2026-06-13 22:00:00+00','BC Place, Vancouver'),
    -- Grupo E
    ( 9,'GER','CUW','2026-06-14 16:00:00+00','Lincoln Financial Field, Philadelphia'),
    (10,'CIV','ECU','2026-06-14 19:00:00+00','NRG Stadium, Houston'),
    -- Grupo F
    (11,'NED','JPN','2026-06-14 22:00:00+00','AT&T Stadium, Arlington'),
    (12,'SWE','TUN','2026-06-15 01:00:00+00','Estadio BBVA, Monterrey'),
    -- Grupo G
    (15,'BEL','EGY','2026-06-15 22:00:00+00','SoFi Stadium, Los Angeles'),
    (16,'IRN','NZL','2026-06-16 01:00:00+00','Lumen Field, Seattle'),
    -- Grupo H
    (13,'ESP','CPV','2026-06-15 16:00:00+00','Hard Rock Stadium, Miami Gardens'),
    (14,'KSA','URU','2026-06-15 19:00:00+00','Mercedes-Benz Stadium, Atlanta'),
    -- Grupo I
    (17,'FRA','SEN','2026-06-16 16:00:00+00','MetLife Stadium, East Rutherford'),
    (18,'IRQ','NOR','2026-06-16 19:00:00+00','Gillette Stadium, Foxborough'),
    -- Grupo J
    (19,'ARG','ALG','2026-06-16 22:00:00+00','Arrowhead Stadium, Kansas City'),
    (20,'AUT','JOR','2026-06-17 01:00:00+00','Levi''s Stadium, Santa Clara'),
    -- Grupo K
    (23,'POR','COD','2026-06-17 22:00:00+00','NRG Stadium, Houston'),
    (24,'UZB','COL','2026-06-18 01:00:00+00','Estadio Azteca, Ciudad de México'),
    -- Grupo L
    (21,'ENG','CRO','2026-06-17 16:00:00+00','BMO Field, Toronto'),
    (22,'GHA','PAN','2026-06-17 19:00:00+00','AT&T Stadium, Arlington'),

    -- ── RONDA 2 (Jun 18–23) ──────────────────────────────────
    -- Grupo A
    (25,'CZE','RSA','2026-06-18 16:00:00+00','Mercedes-Benz Stadium, Atlanta'),
    (28,'MEX','KOR','2026-06-19 01:00:00+00','Estadio Akron, Guadalajara'),
    -- Grupo B
    (26,'SUI','BIH','2026-06-18 19:00:00+00','SoFi Stadium, Los Angeles'),
    (27,'CAN','QAT','2026-06-18 22:00:00+00','BC Place, Vancouver'),
    -- Grupo C
    (29,'BRA','HAI','2026-06-19 16:00:00+00','Lincoln Financial Field, Philadelphia'),
    (30,'SCO','MAR','2026-06-19 19:00:00+00','MetLife Stadium, East Rutherford'),
    -- Grupo D
    (31,'TUR','PAR','2026-06-19 22:00:00+00','Levi''s Stadium, Santa Clara'),
    (32,'USA','AUS','2026-06-20 01:00:00+00','Lumen Field, Seattle'),
    -- Grupo E
    (33,'GER','CIV','2026-06-20 16:00:00+00','BMO Field, Toronto'),
    (34,'ECU','CUW','2026-06-20 19:00:00+00','Arrowhead Stadium, Kansas City'),
    -- Grupo F
    (35,'NED','SWE','2026-06-20 22:00:00+00','NRG Stadium, Houston'),
    (36,'TUN','JPN','2026-06-21 01:00:00+00','Estadio BBVA, Monterrey'),
    -- Grupo G
    (39,'BEL','IRN','2026-06-21 22:00:00+00','SoFi Stadium, Los Angeles'),
    (40,'NZL','EGY','2026-06-22 01:00:00+00','BC Place, Vancouver'),
    -- Grupo H
    (37,'ESP','KSA','2026-06-21 16:00:00+00','Hard Rock Stadium, Miami Gardens'),
    (38,'URU','CPV','2026-06-21 19:00:00+00','Mercedes-Benz Stadium, Atlanta'),
    -- Grupo I
    (41,'FRA','IRQ','2026-06-22 16:00:00+00','MetLife Stadium, East Rutherford'),
    (42,'NOR','SEN','2026-06-22 19:00:00+00','Lincoln Financial Field, Philadelphia'),
    -- Grupo J
    (43,'ARG','AUT','2026-06-22 22:00:00+00','AT&T Stadium, Arlington'),
    (44,'JOR','ALG','2026-06-23 01:00:00+00','Levi''s Stadium, Santa Clara'),
    -- Grupo K
    (47,'POR','UZB','2026-06-23 22:00:00+00','NRG Stadium, Houston'),
    (48,'COL','COD','2026-06-24 01:00:00+00','Estadio Akron, Guadalajara'),
    -- Grupo L
    (45,'ENG','GHA','2026-06-23 16:00:00+00','Gillette Stadium, Foxborough'),
    (46,'PAN','CRO','2026-06-23 19:00:00+00','BMO Field, Toronto'),

    -- ── RONDA 3 (Jun 24–27) ──────────────────────────────────
    -- Grupos A+C simultáneos (mismo horario)
    (49,'MEX','CZE','2026-06-24 16:00:00+00','Estadio Azteca, Ciudad de México'),
    (53,'SCO','BRA','2026-06-24 16:00:00+00','Hard Rock Stadium, Miami Gardens'),
    (50,'KOR','RSA','2026-06-24 19:00:00+00','Estadio BBVA, Monterrey'),
    (54,'MAR','HAI','2026-06-24 19:00:00+00','Mercedes-Benz Stadium, Atlanta'),
    -- Grupos B
    (51,'CAN','SUI','2026-06-24 22:00:00+00','BC Place, Vancouver'),
    (52,'BIH','QAT','2026-06-25 01:00:00+00','Lumen Field, Seattle'),
    -- Grupos E+F simultáneos
    (55,'ECU','GER','2026-06-25 16:00:00+00','Lincoln Financial Field, Philadelphia'),
    (57,'TUN','NED','2026-06-25 22:00:00+00','AT&T Stadium, Arlington'),
    (56,'CUW','CIV','2026-06-25 19:00:00+00','MetLife Stadium, East Rutherford'),
    (58,'JPN','SWE','2026-06-26 01:00:00+00','Arrowhead Stadium, Kansas City'),
    -- Grupo D — simultáneos Jun 25 7PM PDT = Jun 26 02:00 UTC (confirmado Wikipedia)
    (59,'TUR','USA','2026-06-26 02:00:00+00','SoFi Stadium, Los Angeles'),
    (60,'PAR','AUS','2026-06-26 02:00:00+00','Levi''s Stadium, Santa Clara'),
    -- Grupos I+H simultáneos
    (61,'NOR','FRA','2026-06-26 16:00:00+00','Gillette Stadium, Foxborough'),
    (65,'URU','ESP','2026-06-26 16:00:00+00','NRG Stadium, Houston'),
    (62,'SEN','IRQ','2026-06-26 19:00:00+00','BMO Field, Toronto'),
    (66,'CPV','KSA','2026-06-26 19:00:00+00','Estadio Akron, Guadalajara'),
    -- Grupo G
    (63,'NZL','BEL','2026-06-26 22:00:00+00','Lumen Field, Seattle'),
    (64,'EGY','IRN','2026-06-27 01:00:00+00','BC Place, Vancouver'),
    -- Grupos L+K simultáneos
    (67,'PAN','ENG','2026-06-27 16:00:00+00','MetLife Stadium, East Rutherford'),
    (71,'COL','POR','2026-06-27 16:00:00+00','Hard Rock Stadium, Miami Gardens'),
    (68,'CRO','GHA','2026-06-27 19:00:00+00','Lincoln Financial Field, Philadelphia'),
    (72,'COD','UZB','2026-06-27 19:00:00+00','Mercedes-Benz Stadium, Atlanta'),
    -- Grupo J
    (69,'JOR','ARG','2026-06-27 22:00:00+00','Arrowhead Stadium, Kansas City'),
    (70,'ALG','AUT','2026-06-28 01:00:00+00','AT&T Stadium, Arlington')

) AS v(mn, home_code, away_code, sat, venue)
JOIN teams h ON h.code = v.home_code
JOIN teams a ON a.code = v.away_code;
