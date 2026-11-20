"""Punto de entrada: data/ -> data/procesado. Ejecuta: .venv\\Scripts\\python -m backend.pipeline.ejecutar"""
import json
from datetime import datetime

import pandas as pd

from backend import config
from backend.pipeline.cargar import cargar_todo
from backend.pipeline.metricas import comparar_contra_resto
from backend.pipeline.situaciones import preparar

COLUMNAS_SALIDA = ["muestra", "nivel", "metrica", "equipo", "down", "distancia", "grupo_rushers",
                   "n", "exitos", "tasa", "ic_inf", "ic_sup", "n_resto", "exitos_resto", "tasa_resto",
                   "ic_resto_inf", "ic_resto_sup", "ventaja", "evidencia"]


def celdas_de_muestra(df: pd.DataFrame, muestra: str, universo: dict) -> pd.DataFrame:
    partes = []
    fino = comparar_contra_resto(df, "ataque", ["down_c", "distancia_c", "grupo_rushers"], "presion", universo)
    partes.append(fino.assign(nivel="fino", metrica="presion"))
    agrupado = comparar_contra_resto(df, "ataque", ["down_c", "grupo_rushers"], "presion", universo)
    partes.append(agrupado.assign(nivel="agrupado", metrica="presion", distancia_c=config.TODAS))
    blitz = comparar_contra_resto(df, "ataque", ["down_c", "distancia_c"], "blitz", universo)
    partes.append(blitz.assign(nivel="fino", metrica="blitz_recibido", grupo_rushers=config.TODOS))
    t = pd.concat(partes, ignore_index=True).assign(muestra=muestra)
    t = t.rename(columns={"ataque": "equipo", "down_c": "down", "distancia_c": "distancia"})
    return t[COLUMNAS_SALIDA]


def revision(celdas: pd.DataFrame) -> dict:
    """Situaciones (equipo x situación) con n suficiente y cuántas tienen ventaja clara."""
    salida = {}
    presion = celdas[celdas.metrica == "presion"]
    for (muestra, nivel), g in presion.groupby(["muestra", "nivel"]):
        revisadas = g[g.n >= config.N_MINIMO]
        salida.setdefault(muestra, {})[nivel] = {
            "revisadas": int(len(revisadas)),
            "con_ventaja": int((revisadas.ventaja > 0).sum()),
        }
    return salida


def elegir_hallazgo(celdas: pd.DataFrame, muestra: str) -> dict | None:
    """La situación del nivel fino con mayor ventaja clara. Ningún equipo escrito a mano."""
    c = celdas[(celdas.muestra == muestra) & (celdas.nivel == "fino") & (celdas.metrica == "presion")
               & celdas.evidencia.isin(["indicio", "solida"])]
    if c.empty:
        return None
    mejor = c.loc[c.ventaja.idxmax()]
    return {k: str(mejor[k]) for k in ["equipo", "down", "distancia", "grupo_rushers"]}


def main() -> None:
    tablas = cargar_todo(config.RUTA_DATOS)
    jugadas, resumen = preparar(tablas)

    equipos = sorted(set(jugadas.ataque) | set(jugadas.defensa))
    universo = {
        "ataque": equipos,
        "down_c": [d["valor"] for d in config.DOWNS],
        "distancia_c": [d["valor"] for d in config.DISTANCIAS],
        "grupo_rushers": [g["valor"] for g in config.GRUPOS_RUSHERS],
    }
    neutral = jugadas[jugadas.neutral]
    celdas = pd.concat([celdas_de_muestra(neutral, "neutral", universo),
                        celdas_de_muestra(jugadas, "completa", universo)], ignore_index=True)

    rev = revision(celdas)
    # Si el filtro neutral no deja ninguna situación con muestra suficiente, se usa la muestra completa
    aplicado = rev.get("neutral", {}).get("fino", {}).get("revisadas", 0) > 0
    principal = "neutral" if aplicado else "completa"
    hallazgo = elegir_hallazgo(celdas, principal)

    temporadas = sorted(int(t) for t in jugadas.temporada.unique())
    salida_resumen = {
        "generado": datetime.now().isoformat(timespec="seconds"),
        "cobertura": {
            "temporadas": temporadas,
            "semana_min": int(jugadas.semana.min()),
            "semana_max": int(jugadas.semana.max()),
            "partidos": int(jugadas.partido.nunique()),
            "equipos": equipos,
            "jugadas": int(len(jugadas)),
            "jugadas_neutral": int(len(neutral)),
        },
        "juego_neutral": {
            "aplicado": aplicado,
            "cuartos": list(config.CUARTOS_NEUTRAL),
            "diferencia_maxima": config.DIFERENCIA_MAXIMA_NEUTRAL,
        },
        "muestra_principal": principal,
        "revision": rev,
        "hallazgo": hallazgo,
        "filas_leidas": resumen["filas_leidas"],
        "descartes": resumen["descartes"],
    }

    config.RUTA_PROCESADO.mkdir(parents=True, exist_ok=True)
    celdas.round(6).to_csv(config.ARCHIVO_CELDAS, index=False)
    config.ARCHIVO_RESUMEN.write_text(json.dumps(salida_resumen, ensure_ascii=False, indent=2), encoding="utf-8")

    imprimir_resumen(salida_resumen, celdas, equipos)


def imprimir_resumen(r: dict, celdas: pd.DataFrame, equipos: list[str]) -> None:
    print(f"Filas leídas de jugadas: {r['filas_leidas']}")
    print(f"Jugadas válidas: {r['cobertura']['jugadas']} (juego neutral: {r['cobertura']['jugadas_neutral']})")
    for motivo, n in r["descartes"].items():
        print(f"  Descartadas por {motivo}: {n}")
    print(f"Equipos: {len(equipos)} | Partidos: {r['cobertura']['partidos']} | "
          f"Semanas {r['cobertura']['semana_min']}-{r['cobertura']['semana_max']}")
    sin_nombre = [e for e in equipos if e not in config.NOMBRES_EQUIPOS]
    if sin_nombre:
        print(f"  Aviso: sin nombre en config.NOMBRES_EQUIPOS: {sin_nombre}")
    print(f"Juego neutral aplicado: {r['juego_neutral']['aplicado']} (muestra principal: {r['muestra_principal']})")
    for muestra, niveles in r["revision"].items():
        for nivel, v in niveles.items():
            print(f"  {muestra}/{nivel}: {v['con_ventaja']} de {v['revisadas']} situaciones con ventaja clara")
    print(f"Hallazgo: {r['hallazgo']}")
    print(f"Escrito: {config.ARCHIVO_CELDAS.relative_to(config.RAIZ)} ({len(celdas)} filas), "
          f"{config.ARCHIVO_RESUMEN.relative_to(config.RAIZ)}")


if __name__ == "__main__":
    main()
