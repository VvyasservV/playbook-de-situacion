"""Funciones puras: tasas, intervalo de Wilson, comparación contra el resto de la liga y ventaja clara."""
import itertools

import numpy as np
import pandas as pd

from backend import config


def wilson(exitos, n, z: float = config.Z_95):
    """Intervalo de Wilson. Acepta escalares o arreglos. Con n = 0 devuelve NaN."""
    exitos = np.asarray(exitos, dtype=float)
    n = np.asarray(n, dtype=float)
    with np.errstate(invalid="ignore", divide="ignore"):
        p = exitos / n
        den = 1 + z**2 / n
        centro = (p + z**2 / (2 * n)) / den
        margen = z * np.sqrt(p * (1 - p) / n + z**2 / (4 * n**2)) / den
    inf = np.where(n > 0, np.clip(centro - margen, 0, 1), np.nan)
    sup = np.where(n > 0, np.clip(centro + margen, 0, 1), np.nan)
    return inf, sup


def ventaja_clara(tasa, ic_inf, ic_sup, tasa_ref, ic_ref_inf, ic_ref_sup):
    """Distancia entre intervalos. Positiva solo si no se tocan; 0 o negativa si se traslapan."""
    tasa, tasa_ref = np.asarray(tasa, float), np.asarray(tasa_ref, float)
    arriba = np.asarray(ic_inf, float) - np.asarray(ic_ref_sup, float)
    abajo = np.asarray(ic_ref_inf, float) - np.asarray(ic_sup, float)
    return np.where(tasa >= tasa_ref, arriba, abajo)


def evidencia(n, ventaja):
    """insuficiente (n < 30), sin_diferencia (rangos se tocan), indicio (30-49) o solida (50+)."""
    n = np.asarray(n, float)
    ventaja = np.asarray(ventaja, float)
    con_ventaja = np.nan_to_num(ventaja, nan=-1.0) > 0
    return np.select(
        [n < config.N_MINIMO, ~con_ventaja, n < config.N_SOLIDA],
        ["insuficiente", "sin_diferencia", "indicio"],
        default="solida",
    )


def comparar_contra_resto(df: pd.DataFrame, columna_equipo: str, claves: list[str], columna_exito: str,
                          universo: dict[str, list] | None = None) -> pd.DataFrame:
    """Una fila por equipo x situación: tasa del equipo contra el resto de la liga sin el equipo.

    `universo` da todos los valores posibles de cada columna para completar la rejilla con n = 0.
    """
    columnas = [columna_equipo] + claves
    obs = df.groupby(columnas)[columna_exito].agg(n="count", exitos="sum")
    if universo is not None:
        indice = pd.MultiIndex.from_tuples(list(itertools.product(*(universo[c] for c in columnas))), names=columnas)
        obs = obs.reindex(indice, fill_value=0)
    obs = obs.reset_index()
    total = df.groupby(claves)[columna_exito].agg(n_total="count", exitos_total="sum").reset_index()
    t = obs.merge(total, on=claves, how="left", validate="m:1").fillna({"n_total": 0, "exitos_total": 0})

    # La referencia excluye las jugadas del propio equipo
    t["n_resto"] = (t.n_total - t.n).astype(int)
    t["exitos_resto"] = (t.exitos_total - t.exitos).astype(int)
    t = t.drop(columns=["n_total", "exitos_total"])
    t["n"] = t.n.astype(int)
    t["exitos"] = t.exitos.astype(int)

    with np.errstate(invalid="ignore", divide="ignore"):
        t["tasa"] = np.where(t.n > 0, t.exitos / t.n, np.nan)
        t["tasa_resto"] = np.where(t.n_resto > 0, t.exitos_resto / t.n_resto, np.nan)
    t["ic_inf"], t["ic_sup"] = wilson(t.exitos, t.n)
    t["ic_resto_inf"], t["ic_resto_sup"] = wilson(t.exitos_resto, t.n_resto)
    t["ventaja"] = ventaja_clara(t.tasa, t.ic_inf, t.ic_sup, t.tasa_resto, t.ic_resto_inf, t.ic_resto_sup)
    t["evidencia"] = evidencia(t.n, t.ventaja)
    return t
