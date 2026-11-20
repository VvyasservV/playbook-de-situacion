# La pregunta y el hallazgo

## Pregunta de coach

Punto de vista: coordinador defensivo que prepara el partido contra un ataque rival.

**¿Contra qué ataques, y en qué down y distancia, basta con mandar 4 rushers para llegar al QB,
sin gastar un blitz?**

## Hallazgo

**Con 4 rushers o menos, Carolina (CAR) permite presión en 59.0% de sus pases de 2.º y largo
(n = 39, IC 95%: 43.4-72.9%), contra 30.1% del resto de la liga (n = 764, IC 95%: 27.0-33.5%).**

Decisión: contra Carolina en 2.º y largo, presiona con 4 y deja 7 en cobertura.

| | Carolina | Resto de la liga | Ventaja clara | Evidencia |
|---|---|---|---|---|
| Juego neutral | 59.0% (23 de 39), IC 43.4-72.9% | 30.1% (230 de 764), IC 27.0-33.5% | +10.0 pts | indicio (30 ≤ n < 50) |
| Sin filtro de juego neutral | 59.4% (38 de 64), IC 47.1-70.5% | 31.9% (486 de 1,525), IC 29.6-34.3% | +12.9 pts | sólida (n ≥ 50) |

### Respaldo (nivel agrupado por down)

Agrupando todas las distancias, Carolina también aparece en 2.º down con ventaja clara: 46.2%
(24 de 52, IC 33.3-59.5%) contra 29.7% del resto de la liga (312 de 1,051, IC 27.0-32.5%),
ventaja +0.8 pts, evidencia sólida. Sin filtro: 46.2% (n = 91) contra 31.9% (n = 2,112), +2.4 pts.
El hallazgo aparece en los dos niveles de detalle.

### Cuando la defensa sí manda blitz (5 o más rushers) en 2.º y largo

| | Carolina | Resto de la liga | Evidencia |
|---|---|---|---|
| Juego neutral | 53.8% (7 de 13), IC 29.1-76.8% | 41.3% (76 de 184), IC 34.4-48.5% | insuficiente (n < 30) |
| Sin filtro | 55.6% (10 de 18), IC 33.7-75.4% | 46.8% (180 de 385), IC 41.8-51.7% | insuficiente (n < 30) |

Con blitz no hay muestra para recomendar nada. La presión que Carolina permite con 4 rushers
(59.0%, IC 43.4-72.9%) es comparable a la que el resto de la liga permite cuando le mandan blitz
(41.3%, IC 34.4-48.5%).
Tendencia: en 2.º y largo la liga le manda blitz a Carolina en 25.0% de las jugadas (13 de 52,
IC 15.2-38.2%), contra 19.4% al resto (184 de 948, IC 17.0-22.0%). Los rangos se tocan.

## Transparencia: cuántas situaciones se revisaron

| Nivel | Situación | Situaciones (equipo × situación) con n ≥ 30 | Con ventaja clara |
|---|---|---|---|
| A, fino (el de la app) | rushers × down × distancia | 30 | 2 |
| B, agrupado | rushers × down | 65 | 3 |

Las dos cifras van en la interfaz y en el README. El criterio de las 10:20 se cumple por el
paso 2 de `product.md` (agrupar cubetas y volver a medir): con el nivel B hay 3 situaciones con
ventaja clara, así que la pregunta tiene señal. El titular usa el nivel A.

La app usa el nivel A (equipo, down y distancia) para las tarjetas y la consulta.

## Definiciones

| Concepto | Definición |
|---|---|
| Jugada | Fila de `plays.csv` con `down` de 1 a 4 (se excluyen 35 conversiones de 2 puntos, `down == 0`) |
| Rushers | Jugadores con `pff_role == "Pass Rush"` en la jugada (PFF) |
| Grupos de rushers | 4 o menos; blitz = 5 o más |
| Presión | Algún defensor con `pff_hit`, `pff_hurry` o `pff_sack` igual a 1 en la jugada |
| Down | 1.º, 2.º, y 3.º/4.º juntos |
| Distancia | Corta 1-2 yardas, media 3-6, larga 7 o más (larga y muy larga juntas) |
| Juego neutral | Cuartos 1 a 3 y diferencia de marcador de 8 puntos o menos |
| Referencia | Resto de la liga sin el equipo, en la misma situación y grupo de rushers |
| Intervalo | Wilson al 95% |
| Ventaja clara | Equipo arriba: `ic_equipo_inferior - ic_resto_superior`; abajo: `ic_resto_inferior - ic_equipo_superior`. Solo cuenta si es mayor que 0 ("solo mostramos diferencias donde los rangos no se tocan") |
| Evidencia | n < 30 insuficiente; 30 a 49 indicio; 50 o más sólida (con ventaja clara) |

## Limitaciones

- **Muestra corta**: 8 semanas de la temporada 2021. Carolina jugó 8 partidos y el hallazgo
  descansa en 39 jugadas en juego neutral.
- **Efecto específico del 2.º y largo**: con 4 rushers en general Carolina no se aleja de la liga
  (39.5%, n = 114, contra 32.7%, n = 3,113; los rangos se tocan). Tampoco en 3.º/4.º down (38.2%,
  n = 34, contra 42.2%) ni en 1.er down (28.6%, n = 28, contra 28.0%).
- **Un solo mariscal**: 276 de las 294 jugadas de Carolina son de Sam Darnold (18 de Phillip
  Walker). Las 39 jugadas del hallazgo en juego neutral son de Darnold. Parte de la presión
  puede venir del mariscal (cuánto retiene el balón) y no solo de la línea.
- **Comparaciones múltiples**: se revisaron 30 situaciones con muestra suficiente; alguna puede
  salir distinta por azar.
- **Asociación, no causa**: el dato dice que Carolina se asocia con más presión en 2.º y largo
  con 4 rushers; no prueba que mandar 4 la provoque.
- **Presión según PFF**: hit, hurry y sack son anotaciones de analistas de PFF, no mediciones.
- **Sin EPA**: el dataset no la trae.
