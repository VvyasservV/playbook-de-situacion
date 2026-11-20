# Contrato de la API

La API solo lee los agregados de `data/procesado/` que genera la tubería. Todas las respuestas
son JSON. En el backend las rutas se declaran con diagonal (`/api/meta`); en el dashboard se
llaman sin diagonal inicial (`fetch('api/meta')`).

Los valores de los ejemplos salen de `docs/pregunta.md` cuando existen ahí; los que no, son
ilustrativos y van marcados con `…`. Nunca se usan como datos.

## Decisiones aprobadas

- `api/situacion` usa solo equipo, down y distancia, sin zona ni rol. Es el nivel de detalle
  del hallazgo (rushers × down × distancia). La pregunta es siempre sobre el ataque rival: qué
  presión permite según cuántos rushers le mandan.
- Los equipos se muestran como "Carolina Panthers (CAR)". Los nombres salen de un diccionario
  fijo de las 32 abreviaturas en `backend/config.py` (nombres, no datos). Si una abreviatura del
  dataset no está en el diccionario, se muestra solo la abreviatura.
- Las comparaciones de los textos ("casi el doble", "13 puntos más") salen de la razón y la
  diferencia calculadas, nunca de texto fijo.

## Agregados que escribe la tubería (`data/procesado/`)

| Archivo | Una fila es | Columnas |
|---|---|---|
| `celdas.csv` | Un equipo en una situación, para una muestra, un nivel y una métrica | `muestra` (`neutral`, `completa`), `nivel` (`fino`, `agrupado`), `metrica` (`presion`, `blitz_recibido`), `equipo`, `down`, `distancia` (`todas` en el nivel agrupado), `grupo_rushers` (`todos` en `blitz_recibido`), `n`, `exitos`, `tasa`, `ic_inf`, `ic_sup`, `n_resto`, `exitos_resto`, `tasa_resto`, `ic_resto_inf`, `ic_resto_sup`, `ventaja`, `evidencia` |
| `resumen.json` | Metadatos de la ejecución | `generado`, `cobertura`, `juego_neutral` (`aplicado`, `cuartos`, `diferencia_maxima`), `muestra_principal`, `revision` por muestra y nivel, `hallazgo` (equipo, down, distancia y grupo de rushers elegidos, o `null`), `descartes` |

- La rejilla está completa: hay fila para cada equipo × situación aunque `n` sea 0.
- `ventaja` es la ventaja clara sin recortar (negativa si los rangos se tocan). La API la
  devuelve como `ventaja_clara` y la pone en `null` cuando la evidencia es `insuficiente`.
- `metrica = presion`: `exitos` = jugadas con presión. `metrica = blitz_recibido`: `exitos` =
  jugadas en que la defensa mandó blitz (la tendencia de la tarjeta).
- Si ninguna situación tiene ventaja clara, `hallazgo` es `null` y `api/hallazgo` responde con
  `frase` explicando que no hay hallazgo y sin gráfica.

## Convenciones

- Tasas entre 0 y 1. Intervalos como `[inferior, superior]`, Wilson al 95%.
- Valores de las cubetas (los define `backend/config.py` y llegan por `api/meta`):
  - `down`: `"1"`, `"2"`, `"3-4"`.
  - `distancia`: `"corta"` (1-2), `"media"` (3-6), `"larga"` (7 o más).
  - `grupo_rushers`: `"4_o_menos"`, `"blitz"` (5 o más).
- `evidencia`:
  - `"insuficiente"`: n < 30. `ventaja_clara` es `null` y no hay recomendación.
  - `"sin_diferencia"`: n ≥ 30 y los rangos se tocan (ventaja ≤ 0).
  - `"indicio"`: 30 ≤ n < 50 con ventaja clara.
  - `"solida"`: n ≥ 50 con ventaja clara.
- `direccion`: `"mas_presion"` (el equipo permite más presión que la liga),
  `"menos_presion"` o `null` cuando no hay ventaja clara.
- Los parámetros usan la abreviatura del dataset (`"CAR"`). Las respuestas traen además el
  nombre para mostrar (`"Carolina Panthers (CAR)"`) en el campo `equipo_nombre`.
- Errores: parámetro con valor inválido → 422 (validación de FastAPI). Equipo que no existe en
  los datos → 404 con `{"detail": "Equipo no encontrado: XXX"}`.

## `GET /health`

Ya existe en la plantilla. Responde `{"status": "ok"}`.

## `GET /api/meta`

Opciones de los selectores, umbrales, definiciones y estado de la tubería.

```json
{
  "equipos": [
    { "valor": "ARI", "nombre": "Arizona Cardinals (ARI)", "color": "#97233F" },
    { "valor": "…", "nombre": "…", "color": "…" }
  ],
  "downs": [
    { "valor": "1", "etiqueta": "1.er down" },
    { "valor": "2", "etiqueta": "2.º down" },
    { "valor": "3-4", "etiqueta": "3.º y 4.º down" }
  ],
  "distancias": [
    { "valor": "corta", "etiqueta": "Corta (1-2 yardas)", "min": 1, "max": 2 },
    { "valor": "media", "etiqueta": "Media (3-6 yardas)", "min": 3, "max": 6 },
    { "valor": "larga", "etiqueta": "Larga (7 o más)", "min": 7, "max": null }
  ],
  "grupos_rushers": [
    { "valor": "4_o_menos", "etiqueta": "4 rushers o menos", "min": 0, "max": 4 },
    { "valor": "blitz", "etiqueta": "Blitz (5 o más)", "min": 5, "max": null }
  ],
  "umbrales": { "n_minimo": 30, "n_solida": 50, "confianza": 0.95 },
  "definiciones": {
    "presion": "La jugada terminó en golpe, apuro o sack al QB, según PFF.",
    "blitz": "La defensa manda 5 o más rushers.",
    "juego_neutral": "Cuartos 1 a 3 y diferencia de marcador de 8 puntos o menos.",
    "ventaja_clara": "Solo mostramos diferencias donde los rangos no se tocan.",
    "referencia": "Resto de la liga, sin el equipo, en la misma situación."
  },
  "juego_neutral": { "aplicado": true, "cuartos": [1, 2, 3], "diferencia_maxima": 8 },
  "cobertura": { "temporadas": [2021], "semana_min": 1, "semana_max": 8, "partidos": 122, "jugadas": 8522 },
  "revision": {
    "fino": { "descripcion": "rushers × down × distancia", "revisadas": 30, "con_ventaja": 2 },
    "agrupado": { "descripcion": "rushers × down", "revisadas": 65, "con_ventaja": 3 }
  },
  "generado": "2026-…T…"
}
```

- `revisadas` = situaciones (equipo × situación × grupo de rushers) con n ≥ 30.
- `juego_neutral.aplicado` es `false` si con el filtro no queda ninguna situación con n ≥ 30;
  entonces todo se calcula con la muestra completa y la interfaz lo dice como limitación.
- `generado`: fecha y hora de la última ejecución de la tubería.

## `GET /api/hallazgo`

El hallazgo principal y los datos de la gráfica de firma. La tubería lo elige con una regla, sin
equipos escritos a mano: la situación del nivel fino con mayor `ventaja_clara`.

```json
{
  "frase": "Con 4 rushers o menos, Carolina Panthers (CAR) permite presión en 59.0% de sus pases de 2.º y largo (n = 39), contra 30.1% del resto de la liga.",
  "decision": "Presiona con 4 y deja 7 en cobertura.",
  "equipo_nombre": "Carolina Panthers (CAR)",
  "situacion": { "equipo": "CAR", "down": "2", "distancia": "larga", "grupo_rushers": "4_o_menos" },
  "juego_neutral": true,
  "equipo": { "n": 39, "exitos": 23, "tasa": 0.590, "ic95": [0.434, 0.729] },
  "resto_liga": { "n": 764, "exitos": 230, "tasa": 0.301, "ic95": [0.270, 0.335] },
  "ventaja_clara": 0.100,
  "direccion": "mas_presion",
  "evidencia": "indicio",
  "sin_filtro": {
    "equipo": { "n": 64, "exitos": 38, "tasa": 0.594, "ic95": [0.471, 0.705] },
    "resto_liga": { "n": 1525, "exitos": 486, "tasa": 0.319, "ic95": [0.296, 0.343] },
    "ventaja_clara": 0.129,
    "evidencia": "solida"
  },
  "respaldo": {
    "descripcion": "Mismo equipo y down, todas las distancias",
    "situacion": { "equipo": "CAR", "down": "2", "distancia": null, "grupo_rushers": "4_o_menos" },
    "equipo": { "n": 52, "exitos": 24, "tasa": 0.462, "ic95": [0.333, 0.595] },
    "resto_liga": { "n": 1051, "exitos": 312, "tasa": 0.297, "ic95": [0.270, 0.325] },
    "ventaja_clara": 0.008,
    "evidencia": "solida"
  },
  "grafica": {
    "titulo": "Carolina Panthers (CAR) permite presión con 4 rushers casi el doble que el resto de la liga en 2.º y largo",
    "eje": "Tasa de presión permitida (%)",
    "filas": [
      { "etiqueta": "Carolina Panthers (CAR)", "tasa": 0.590, "ic95": [0.434, 0.729], "n": 39 },
      { "etiqueta": "Resto de la liga", "tasa": 0.301, "ic95": [0.270, 0.335], "n": 764 }
    ],
    "hueco": [0.335, 0.434]
  },
  "revision": { "revisadas": 30, "con_ventaja": 2 }
}
```

- `frase`, `decision` y `grafica.titulo` se generan en el backend a partir de los números.
- `hueco` = espacio entre los dos intervalos (lo que se sombrea). `null` si se tocan.
- `respaldo` es `null` si el mismo equipo no tiene ventaja clara en el nivel agrupado.

## Tarjeta de situación

Objeto que devuelven `api/situacion` (una) y `api/reporte` (lista). Una tarjeta es un equipo en
un down y una distancia, con una comparación por grupo de rushers.

```json
{
  "situacion": { "equipo": "CAR", "down": "2", "distancia": "larga" },
  "situacion_corta": "2.º y largo",
  "equipo_nombre": "Carolina Panthers (CAR)",
  "juego_neutral": true,
  "n": 52,
  "tendencia": {
    "etiqueta": "La liga le manda blitz",
    "equipo": { "n": 52, "exitos": 13, "tasa": 0.250, "ic95": [0.152, 0.382] },
    "resto_liga": { "n": 948, "exitos": 184, "tasa": 0.194, "ic95": [0.170, 0.220] }
  },
  "comparaciones": [
    {
      "grupo_rushers": "4_o_menos",
      "metrica": "tasa de presión permitida",
      "equipo": { "n": 39, "exitos": 23, "tasa": 0.590, "ic95": [0.434, 0.729] },
      "resto_liga": { "n": 764, "exitos": 230, "tasa": 0.301, "ic95": [0.270, 0.335] },
      "ventaja_clara": 0.100,
      "direccion": "mas_presion",
      "evidencia": "indicio"
    },
    {
      "grupo_rushers": "blitz",
      "metrica": "tasa de presión permitida",
      "equipo": { "n": 13, "exitos": 7, "tasa": 0.538, "ic95": [0.291, 0.768] },
      "resto_liga": { "n": 184, "exitos": 76, "tasa": 0.413, "ic95": [0.344, 0.485] },
      "ventaja_clara": null,
      "direccion": null,
      "evidencia": "insuficiente"
    }
  ],
  "recomendacion": "Presiona con 4: con 4 rushers o menos Carolina Panthers (CAR) permite presión en 59% de estos pases, contra 30% del resto de la liga (indicio, n = 39).",
  "recomendacion_corta": "Presiona con 4",
  "mensaje": null
}
```

- `recomendacion_corta`: la orden de la call sheet impresa; `null` cuando no hay recomendación.

- `n` = jugadas del equipo en esa situación (los dos grupos de rushers).
- Si el equipo no tiene jugadas en esa situación, `equipo` trae `n: 0`, `tasa: null` e
  `ic95: null`.
- `recomendacion` se genera con reglas en el backend a partir de la comparación con ventaja clara
  más grande:
  - `4_o_menos` + `mas_presion` → "Presiona con 4: …".
  - `4_o_menos` + `menos_presion` → "Con 4 no llegas: …".
  - `blitz` + `mas_presion` → "El blitz rinde: …".
  - `blitz` + `menos_presion` → "Evita el blitz: …".
  - Ninguna con ventaja clara → `recomendacion: null`.
- `mensaje` explica por qué no hay recomendación:
  - Todas las comparaciones con `insuficiente` → "Muestra insuficiente: no recomendamos con
    menos de 30 jugadas".
  - Alguna con n ≥ 30 pero sin ventaja → "Sin diferencia clara: los rangos se tocan con los del
    resto de la liga".

## `GET /api/reporte?equipo=CAR`

Las tarjetas del equipo que tienen al menos una comparación con ventaja clara, ordenadas de mayor
a menor ventaja, y cuántas situaciones se revisaron.

```json
{
  "equipo": "CAR",
  "equipo_nombre": "Carolina Panthers (CAR)",
  "juego_neutral": true,
  "revision_equipo": { "revisadas": "…", "con_ventaja": "…" },
  "revision_liga": { "revisadas": 30, "con_ventaja": 2 },
  "tarjetas": [ { "…": "tarjeta de situación" } ]
}
```

- `revision_equipo`: comparaciones de ese equipo con n ≥ 30, y cuántas tienen ventaja clara.
- `tarjetas` puede ser una lista vacía; la interfaz muestra entonces "Ninguna situación de este
  equipo se separa de la liga con evidencia suficiente".

## `GET /api/situacion?equipo=CAR&down=2&distancia=larga`

Una tarjeta de situación (forma de arriba). Los tres parámetros son obligatorios.
