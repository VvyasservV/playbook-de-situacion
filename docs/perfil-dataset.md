# Perfil del dataset

Generado con pandas 2.2.3 (`.venv`) sobre los archivos de `data/`. El tracking no está
descargado y no se perfila. Diccionario de referencia: `data/README-dataset.md`.

## Resumen de cobertura

| Aspecto | Valor verificado |
|---|---|
| Temporada | 2021 (única) |
| Semanas | 1 a 8 (partidos por semana: 16, 16, 16, 16, 16, 14, 13, 15) |
| Fechas | 09/09/2021 a 11/01/2021 |
| Partidos | 122 (los 122 de `games.csv` aparecen en `plays.csv`) |
| Equipos | 32 |
| Jugadas | 8,557 |
| Jugadas por equipo en ataque | 203 (NO) a 339 (KC), mediana 262.5 |
| Tipos de jugada | **Solo jugadas de pase (dropbacks).** `passResult` nunca es nulo: C 4,620, I 2,755, S 543, R 449, IN 190. **No hay carreras diseñadas, despejes, goles de campo ni patadas.** No se puede medir pase contra carrera ni decisiones de 4.º down. |
| Cuarto | Sí: `quarter` 1 a 5 (5 = tiempo extra, 98 jugadas) |
| Marcador | Sí: `preSnapHomeScore` y `preSnapVisitorScore`, sin nulos |
| Reloj | Sí: `gameClock` en formato MM:SS, de 00:00 a 15:00 |
| Juego neutral (cuartos 1-3, diferencia ≤ 8) | 4,334 de 8,522 jugadas con down 1-4 |

## Archivos

| Archivo | Una fila es | Filas | Columnas | Llave | ¿Llave única? |
|---|---|---|---|---|---|
| `games.csv` | Un partido | 122 | 7 | `gameId` | Sí (0 duplicados) |
| `plays.csv` | Una jugada de pase | 8,557 | 32 | `gameId` + `playId` | Sí (0 duplicados) |
| `players.csv` | Un jugador | 1,679 | 7 | `nflId` | Sí (0 duplicados) |
| `pffScoutingData.csv` | Un jugador en una jugada | 188,254 | 15 | `gameId` + `playId` + `nflId` | Sí (0 duplicados) |

`playId` solo tiene 3,762 valores distintos para 8,557 jugadas: se repite entre partidos. Siempre
se une por `gameId` + `playId`.

## Joins

| Join | Tipo | Filas antes | Filas después | Sin pareja |
|---|---|---|---|---|
| `plays` → `games` por `gameId` | left, m:1 | 8,557 | 8,557 | 0 |
| `pffScoutingData` → `plays` por `gameId` + `playId` | left, m:1 | 188,254 | 188,254 | 0 |
| `pffScoutingData` → `players` por `nflId` | left, m:1 | 188,254 | 188,254 | 0 |
| `plays` → rushers por jugada (agregado de PFF) | left, 1:1 | 8,557 | 8,557 | 1 jugada sin rushers |
| `plays` → presión por jugada (agregado de PFF) | left, 1:1 | 8,557 | 8,557 | 0 |

Otras comprobaciones:

- Todas las jugadas tienen datos de PFF y cada jugada tiene exactamente 22 jugadores en PFF.
- Cada jugada tiene exactamente 1 jugador con `pff_role == "Pass"`.
- Los 1,679 jugadores de `players.csv` aparecen en PFF.
- `possessionTeam` y `defensiveTeam` siempre son los dos equipos del partido y nunca son iguales.

## Hallazgos de calidad que afectan el análisis

1. **`absoluteYardlineNumber` está en la escala x del tracking (10 a 110), aunque el README dice
   "Distance from end zone for possession team".** Con código: en 8,556 de 8,557 jugadas vale
   `10 + yardas_propias` o `110 - yardas_propias` (1 nulo). Usamos `yardlineSide` +
   `yardlineNumber` para calcular las yardas hasta la end zone rival.
2. **Yardas hasta la end zone rival**: si `yardlineSide == possessionTeam`, `100 - yardlineNumber`;
   si es el rival, `yardlineNumber`; si `yardlineSide` es nulo (125 jugadas, todas en la yarda 50),
   50. `yardlineSide` siempre es uno de los dos equipos del partido. Revisé 6 jugadas al azar
   contra `playDescription` y concuerdan (ej. "T.Brady pass short middle to G.Bernard for 7 yards,
   TOUCHDOWN" desde LA 7 → 7 yardas).
3. **Down 0 = conversiones de 2 puntos**: 35 jugadas con `down == 0` y `yardsToGo == 0`; la
   descripción dice "TWO-POINT CONVERSION ATTEMPT". Se excluyen del análisis por situación.
4. **Penalizaciones**: `playResult - prePenaltyPlayResult == penaltyYards` en 97.04% de las
   jugadas. El signo sigue al ataque: "Offensive Holding" promedia -7.2 y "Defensive Pass
   Interference" +15.9. 489 jugadas tienen "No Play" en la descripción (la jugada se anuló por
   falta), pero conservan `passResult` y `prePenaltyPlayResult`. Usamos `prePenaltyPlayResult`.
5. **Intercepciones**: `playResult` y `prePenaltyPlayResult` valen 0 en las 190 IN. En la tasa de
   éxito una intercepción cuenta siempre como fracaso.
6. **Scrambles**: `passResult == "R"` (449) son jugadas de pase que terminaron en carrera del QB.
   Su `dropBackType`: SCRAMBLE 357, SCRAMBLE_ROLLOUT_RIGHT 40, nulo 31, SCRAMBLE_ROLLOUT_LEFT 15,
   DESIGNED_RUN 5, UNKNOWN 1. Hay 1,047 dropbacks con `dropBackType` de scramble: la mayoría
   terminó en pase (el QB escapó y lanzó).
7. **Sacks**: de 543 jugadas con `passResult == "S"`, 536 tienen un defensor con `pff_sack == 1`.
   Ninguna jugada que no sea S tiene `pff_sack == 1`.
8. **Rushers**: distribución de jugadores con `pff_role == "Pass Rush"` por jugada: 0: 1, 1: 2,
   2: 16, 3: 420, 4: 6,011, 5: 1,689, 6: 348, 7: 69, 8: 1. Blitz (5 o más) = 2,107 jugadas (24.6%).
9. **Presión** (algún defensor con `pff_hit`, `pff_hurry` o `pff_sack` = 1): 3,216 de 8,557
   jugadas (37.6%). Con 4 o menos rushers 34.3% (n = 6,427, sin down 0); con blitz 47.7% (n = 2,095).
10. Las columnas `pff_hit`, `pff_hurry`, `pff_sack` solo tienen valor para `Coverage` y `Pass Rush`.
    Las de bloqueo (`*Allowed`, `pff_beatenByDefender`, `pff_blockType`...) solo para `Pass Block`
    y 2,030 filas de `Pass Route` (sin confirmar por qué: probablemente receptores que bloquean
    con chip antes de salir a su ruta).
11. El README escribe los roles en minúsculas ("Pass block", "Pass rush"); en los datos vienen
    como "Pass Block", "Pass Rush", "Pass Route".

## Columnas por archivo

Para columnas categóricas se listan todos los valores con su conteo (sin nulos). Para numéricas
continuas, mínimo, mediana y máximo. Texto libre: número de valores distintos.

### games.csv (122 filas × 7 columnas)

| Columna | Tipo | % nulos | Distintos | Valores (conteo) | Estado |
|---|---|---|---|---|---|
| `gameId` | int64 | 0.00 | 122 | Identificador entero de 10 dígitos | confirmada |
| `season` | int64 | 0.00 | 1 | 2021: 122 | confirmada |
| `week` | int64 | 0.00 | 8 | 1: 16, 2: 16, 3: 16, 4: 16, 5: 16, 6: 14, 7: 13, 8: 15 | confirmada |
| `gameDate` | object | 0.00 | 24 | Texto mm/dd/yyyy | probable |
| `gameTimeEastern` | object | 0.00 | 6 | 13:00:00: 65, 16:25:00: 18, 20:20:00: 16, 16:05:00: 13, 20:15:00: 8, 09:30:00: 2 | probable |
| `homeTeamAbbr` | object | 0.00 | 32 | NE: 5, CLE: 5, BUF: 4, TB: 4, DET: 4, HOU: 4, IND: 4, ATL: 4, NYG: 4, TEN: 4, WAS: 4, KC: 4, LV: 4, LA: 4, CHI: 4, CAR: 4, MIN: 4, DEN: 4, JAX: 4, ARI: 4, PIT: 4, BAL: 4, SEA: 4, LAC: 4, NO: 3, CIN: 3, MIA: 3, PHI: 3, NYJ: 3, GB: 3, SF: 3, DAL: 3 | confirmada |
| `visitorTeamAbbr` | object | 0.00 | 32 | PHI: 5, MIA: 5, GB: 5, CIN: 5, SEA: 4, DEN: 4, NYJ: 4, DAL: 4, CHI: 4, ARI: 4, DET: 4, LA: 4, HOU: 4, NO: 4, NYG: 4, SF: 4, IND: 4, WAS: 4, TB: 4, CAR: 4, KC: 4, TEN: 4, MIN: 3, PIT: 3, BAL: 3, CLE: 3, LAC: 3, JAX: 3, LV: 3, NE: 3, BUF: 3, ATL: 3 | confirmada |

### plays.csv (8,557 filas × 32 columnas)

| Columna | Tipo | % nulos | Distintos | Valores (conteo) | Estado |
|---|---|---|---|---|---|
| `gameId` | int64 | 0.00 | 122 | Identificador | confirmada |
| `playId` | int64 | 0.00 | 3,762 | min 54, mediana 2156, max 5223 | confirmada |
| `playDescription` | object | 0.00 | 8,555 | Texto libre del play-by-play | confirmada |
| `quarter` | int64 | 0.00 | 5 | 1: 1,735, 2: 2,441, 3: 1,837, 4: 2,446, 5: 98 | confirmada |
| `down` | int64 | 0.00 | 5 | 0: 35, 1: 3,071, 2: 2,826, 3: 2,394, 4: 231 | confirmada (0 = conversión de 2) |
| `yardsToGo` | int64 | 0.00 | 32 | min 0, mediana 10, max 39 | confirmada |
| `possessionTeam` | object | 0.00 | 32 | KC: 339, DET: 328, MIA: 309, TB: 309, NYG: 299, WAS: 298, CAR: 294, DEN: 292, ATL: 289, NE: 286, TEN: 277, LAC: 274, NYJ: 271, BAL: 271, LV: 264, JAX: 264, DAL: 261, IND: 258, CIN: 258, PHI: 255, BUF: 254, MIN: 254, LA: 251, HOU: 251, CLE: 249, CHI: 248, PIT: 238, ARI: 235, SEA: 233, GB: 226, SF: 219, NO: 203 | confirmada |
| `defensiveTeam` | object | 0.00 | 32 | CIN: 331, TB: 324, LA: 318, TEN: 316, WAS: 308, SEA: 306, MIA: 295, NYG: 288, NE: 282, GB: 279, LV: 275, NO: 269, IND: 267, DEN: 266, ARI: 265, CAR: 263, KC: 263, DAL: 261, CLE: 260, PHI: 260, BAL: 258, MIN: 254, BUF: 249, PIT: 247, NYJ: 247, CHI: 242, HOU: 230, SF: 230, ATL: 229, LAC: 227, DET: 225, JAX: 223 | confirmada |
| `yardlineSide` | object | 1.46 | 32 | 32 equipos; nulo solo en la yarda 50 (125) | confirmada |
| `yardlineNumber` | int64 | 0.00 | 50 | min 1, mediana 30, max 50 | confirmada |
| `gameClock` | object | 0.00 | 898 | MM:SS, de 00:00 a 15:00 | confirmada |
| `preSnapHomeScore` | int64 | 0.00 | 42 | min 0, mediana 10, max 54 | confirmada (no decrece dentro del partido en 99.98% de los pasos) |
| `preSnapVisitorScore` | int64 | 0.00 | 38 | min 0, mediana 10, max 44 | confirmada |
| `passResult` | object | 0.00 | 5 | C: 4,620, I: 2,755, S: 543, R: 449, IN: 190 | confirmada (100% concuerda con "sacked", "scrambles", "INTERCEPTED", "incomplete" en la descripción) |
| `penaltyYards` | float64 | 91.17 | 60 | min -18, mediana 4, max 50 | confirmada (positivo = favorece al ataque) |
| `prePenaltyPlayResult` | int64 | 0.00 | 98 | min -34, mediana 4, max 91 | confirmada |
| `playResult` | int64 | 0.00 | 102 | min -34, mediana 5, max 91 | confirmada |
| `foulName1` | object | 91.40 | 29 | Defensive Pass Interference: 145, Offensive Holding: 144, Defensive Holding: 76, Roughing the Passer: 61, Defensive Offside: 48, Unnecessary Roughness: 44, Illegal Use of Hands: 44, Offensive Pass Interference: 37, Face Mask (15 Yards): 24, Illegal Contact: 21, Intentional Grounding: 16, Taunting: 15, Ineligible Downfield Pass: 9, Illegal Formation: 8, Lowering the Head to Initiate Contact: 7, Illegal Touch Pass: 5, Unsportsmanlike Conduct: 5, Illegal Blindside Block: 5, Illegal Motion: 4, Horse Collar Tackle: 4, Illegal Forward Pass: 2, Tripping: 2, Disqualification: 2, Low Block: 2, Illegal Shift: 2, Illegal Block Above the Waist: 1, Chop Block: 1, Illegal Substitution: 1, Clipping: 1 | confirmada |
| `foulNFLId1` | float64 | 91.40 | 486 | `nflId` del infractor | probable |
| `foulName2` | object | 99.65 | 15 | Offensive Holding: 5, Defensive Pass Interference: 5, Defensive Holding: 4, Roughing the Passer: 2, Defensive Offside: 2, Unsportsmanlike Conduct: 2, Unnecessary Roughness: 2, Face Mask (15 Yards): 1, Tripping: 1, Illegal Use of Hands: 1, Taunting: 1, Disqualification: 1, Intentional Grounding: 1, Offensive Pass Interference: 1, Illegal Contact: 1 | confirmada |
| `foulNFLId2` | float64 | 99.65 | 30 | `nflId` del infractor | probable |
| `foulName3` | object | 99.99 | 1 | Illegal Contact: 1 | confirmada |
| `foulNFLId3` | float64 | 99.99 | 1 | `nflId` del infractor | probable |
| `absoluteYardlineNumber` | float64 | 0.01 | 99 | min 11, mediana 59, max 109 | confirmada como escala x del tracking (contradice el README, ver hallazgo 1) |
| `offenseFormation` | object | 0.08 | 7 | SHOTGUN: 5,481, EMPTY: 1,396, SINGLEBACK: 1,189, I_FORM: 298, PISTOL: 154, JUMBO: 30, WILDCAT: 2 | probable |
| `personnelO` | object | 0.01 | 30 | 1 RB, 1 TE, 3 WR: 5,750; 1 RB, 2 TE, 2 WR: 1,501; 2 RB, 1 TE, 2 WR: 437; 1 RB, 3 TE, 1 WR: 227; 1 RB, 0 TE, 4 WR: 184; 2 RB, 2 TE, 1 WR: 110; 0 RB, 1 TE, 4 WR: 89; 2 RB, 0 TE, 3 WR: 66; 6 OL, 1 RB, 1 TE, 2 WR: 41; 0 RB, 2 TE, 3 WR: 28; 6 OL, 1 RB, 2 TE, 1 WR: 20; 0 RB, 0 TE, 5 WR: 14; 2 RB, 3 TE, 0 WR: 13; 2 QB, 1 RB, 1 TE, 2 WR: 12; 6 OL, 2 RB, 2 TE, 0 WR: 11; 6 OL, 1 RB, 3 TE, 0 WR: 8; 6 OL, 2 RB, 0 TE, 2 WR: 5; 2 QB, 1 RB, 0 TE, 3 WR: 5; 6 OL, 2 RB, 1 TE, 1 WR: 5; 2 QB, 2 RB, 0 TE, 2 WR: 4; 2 QB, 1 RB, 2 TE, 1 WR: 4; 0 RB, 3 TE, 2 WR: 4; 2 QB, 2 RB, 1 TE, 1 WR: 3; 3 RB, 0 TE, 2 WR: 3; 6 OL, 1 RB, 0 TE, 3 WR: 3; 1 RB, 1 TE, 2 WR,1 LB: 3; 2 QB, 6 OL, 1 RB, 1 TE, 1 WR: 2; 2 QB, 1 RB, 3 TE, 0 WR: 2; 1 RB, 4 TE, 0 WR: 1; 7 OL, 1 RB, 0 TE, 2 WR: 1 | probable (formato de texto no uniforme: "6 OL", "2 QB", "1 LB") |
| `defendersInBox` | float64 | 0.08 | 11 | 1: 1, 2: 5, 3: 50, 4: 486, 5: 1,644, 6: 4,003, 7: 1,831, 8: 475, 9: 32, 10: 10, 11: 13 | probable |
| `personnelD` | object | 0.01 | 29 | 4 DL, 2 LB, 5 DB: 2,420; 2 DL, 4 LB, 5 DB: 1,541; 3 DL, 3 LB, 5 DB: 1,147; 2 DL, 3 LB, 6 DB: 799; 4 DL, 3 LB, 4 DB: 682; 3 DL, 4 LB, 4 DB: 556; 4 DL, 1 LB, 6 DB: 459; 3 DL, 2 LB, 6 DB: 388; 1 DL, 4 LB, 6 DB: 209; 1 DL, 5 LB, 5 DB: 126; 5 DL, 2 LB, 4 DB: 67; 5 DL, 1 LB, 5 DB: 29; 2 DL, 2 LB, 7 DB: 27; 4 DL, 4 LB, 3 DB: 23; 1 DL, 3 LB, 7 DB: 19; 2 DL, 5 LB, 4 DB: 19; 3 DL, 1 LB, 7 DB: 10; 5 DL, 3 LB, 3 DB: 6; 6 DL, 2 LB, 3 DB: 4; 6 DL, 3 LB, 2 DB: 4; 0 DL, 3 LB, 8 DB: 4; 4 DL, 5 LB, 2 DB: 3; 4 DL, 6 LB, 1 DB: 3; 5 DL, 5 LB, 1 DB: 3; 6 DL, 1 LB, 4 DB: 2; 0 DL, 5 LB, 6 DB: 2; 1 DL, 2 LB, 8 DB: 2; 3 DL, 5 LB, 3 DB: 1; 6 DL, 4 LB, 1 DB: 1 | probable |
| `dropBackType` | object | 6.17 | 8 | TRADITIONAL: 6,542, SCRAMBLE: 899, DESIGNED_ROLLOUT_RIGHT: 285, DESIGNED_ROLLOUT_LEFT: 149, SCRAMBLE_ROLLOUT_RIGHT: 125, SCRAMBLE_ROLLOUT_LEFT: 23, DESIGNED_RUN: 5, UNKNOWN: 1 | probable (DESIGNED_RUN y UNKNOWN sin confirmar) |
| `pff_playAction` | int64 | 0.00 | 2 | 0: 6,519, 1: 2,038 | probable |
| `pff_passCoverage` | object | 0.00 | 12 | Cover-3: 2,665, Cover-1: 2,011, Cover-2: 1,085, Quarters: 1,033, Cover-6: 805, Red Zone: 376, Cover-0: 270, 2-Man: 200, Bracket: 47, Prevent: 32, Goal Line: 25, Miscellaneous: 8 | confirmada (los 12 valores coinciden con el README) |
| `pff_passCoverageType` | object | 0.00 | 3 | Zone: 5,588, Man: 2,481, Other: 488 | probable |

### players.csv (1,679 filas × 7 columnas)

| Columna | Tipo | % nulos | Distintos | Valores (conteo) | Estado |
|---|---|---|---|---|---|
| `nflId` | int64 | 0.00 | 1,679 | Identificador | confirmada |
| `height` | object | 0.00 | 16 | 6-3: 255, 6-4: 231, 6-2: 197, 6-1: 192, 6-5: 183, 6-0: 161, 5-11: 135, 6-6: 110, 5-10: 89, 5-9: 48, 6-7: 36, 5-8: 19, 6-8: 16, 5-6: 3, 6-9: 2, 5-7: 2 | probable (pies-pulgadas) |
| `weight` | int64 | 0.00 | 176 | min 158, mediana 236, max 380 | probable (libras) |
| `birthDate` | object | 13.82 | 1,174 | Texto YYYY-MM-DD | probable |
| `collegeName` | object | 13.34 | 236 | Texto | probable |
| `officialPosition` | object | 0.00 | 19 | WR: 210, CB: 192, DE: 142, OLB: 136, RB: 126, T: 122, TE: 121, DT: 114, G: 99, ILB: 81, FS: 72, SS: 69, QB: 60, C: 55, NT: 34, MLB: 27, FB: 15, LB: 2, DB: 2 | confirmada |
| `displayName` | object | 0.00 | 1,671 | Texto (1,671 nombres para 1,679 jugadores: hay nombres repetidos; usar `nflId`) | confirmada |

### pffScoutingData.csv (188,254 filas × 15 columnas)

| Columna | Tipo | % nulos | Distintos | Valores (conteo) | Estado |
|---|---|---|---|---|---|
| `gameId` | int64 | 0.00 | 122 | Identificador | confirmada |
| `playId` | int64 | 0.00 | 3,762 | Identificador | confirmada |
| `nflId` | int64 | 0.00 | 1,679 | Identificador | confirmada |
| `pff_role` | object | 0.00 | 5 | Coverage: 57,765, Pass Block: 46,057, Pass Route: 39,513, Pass Rush: 36,362, Pass: 8,557 | confirmada |
| `pff_positionLinedUp` | object | 0.00 | 56 | QB: 8,557, C: 8,557, LT: 8,557, LG: 8,557, RG: 8,557, RT: 8,555, RCB: 8,224, LCB: 8,159, LWR: 8,134, RWR: 8,033, ROLB: 5,325, LOLB: 5,070, DRT: 4,812, LEO: 4,659, DLT: 4,371, REO: 4,287, LLB: 4,202, FSL: 3,793, FSR: 3,764, RLB: 3,627, SLWR: 3,546, FS: 3,512, RILB: 3,490, SRWR: 3,468, SCBR: 3,422, LILB: 3,336, SCBL: 3,246, LE: 3,204, HB-L: 2,870, HB-R: 2,676, RE: 2,383, TE-R: 2,241, SRoWR: 1,820, SRiWR: 1,820, SCBoL: 1,690, TE-L: 1,675, HB: 1,624, MLB: 1,595, SLoWR: 1,432, SLiWR: 1,432, SCBoR: 1,342, NT: 1,255, SCBiL: 1,125, SCBiR: 906, SSL: 799, SSR: 758, NRT: 752, NLT: 593, TE-oR: 487, TE-iR: 487, SS: 424, TE-oL: 292, TE-iL: 292, FB-R: 176, FB: 147, FB-L: 137 | probable (códigos como LEO, REO, SCBiL sin confirmar) |
| `pff_hit` | float64 | 50.00 | 2 | 0: 93,284, 1: 843 | confirmada (solo defensores) |
| `pff_hurry` | float64 | 50.00 | 2 | 0: 91,250, 1: 2,877 | confirmada (solo defensores) |
| `pff_sack` | float64 | 50.00 | 2 | 0: 93,525, 1: 602 | confirmada (concuerda con `passResult == "S"`) |
| `pff_beatenByDefender` | float64 | 74.46 | 2 | 0: 46,143, 1: 1,944 | probable |
| `pff_hitAllowed` | float64 | 74.46 | 2 | 0: 47,543, 1: 544 | probable |
| `pff_hurryAllowed` | float64 | 74.46 | 2 | 0: 46,004, 1: 2,083 | probable |
| `pff_sackAllowed` | float64 | 74.46 | 2 | 0: 47,717, 1: 370 | probable |
| `pff_nflIdBlockedPlayer` | float64 | 75.29 | 665 | `nflId` del defensor bloqueado | probable |
| `pff_blockType` | object | 74.55 | 12 | PP: 24,697, PA: 6,331, PT: 5,906, SW: 3,025, CL: 2,595, CH: 1,565, NB: 1,352, PU: 886, SR: 501, BH: 443, UP: 308, PR: 295 | probable (los 12 códigos coinciden con el README) |
| `pff_backFieldBlock` | float64 | 74.55 | 2 | 0: 45,894, 1: 2,009 | sin confirmar (no aparece en `datos-nfl.md`; el README lo describe) |

## Clasificación contra `datos-nfl.md`

- **Confirmada**: existe, su significado está en `datos-nfl.md` y en el README, y lo verifiqué con
  código (valores, joins o descripción de la jugada).
- **Probable**: existe y el significado está documentado, pero no lo verifiqué contra otra columna.
- **Sin confirmar**: no está en `datos-nfl.md` o algún valor no tiene significado documentado.

Diferencias contra `datos-nfl.md`:

- El tracking de este dataset es por partido (`tracking_[gameId].csv`), no por semana. No está en `data/`.
- `pff_backFieldBlock` existe y no está en `datos-nfl.md`.
- No hay archivo de nflverse en `data/`: **no hay EPA, `air_yards` ni `yards_after_catch`**.
  La métrica de resultado disponible es la tasa de éxito (con `prePenaltyPlayResult`).
- `absoluteYardlineNumber` se comporta como dice `datos-nfl.md` (escala x de 0 a 120), no como
  dice el README.
