"""Cubetas de situación (down, distancia, rushers), presión por jugada y filtro de juego neutral."""
import numpy as np
import pandas as pd

from backend import config
from backend.pipeline.cargar import ErrorDatos
from backend.pipeline.columnas import ROL_RUSHER, ROLES_DEFENSA


def cubeta_down(down: pd.Series) -> pd.Series:
    salida = pd.Series(pd.NA, index=down.index, dtype="object")
    for c in config.DOWNS:
        salida[down.isin(c["downs"])] = c["valor"]
    return salida


def cubeta_distancia(yardas: pd.Series) -> pd.Series:
    salida = pd.Series(pd.NA, index=yardas.index, dtype="object")
    for c in config.DISTANCIAS:
        dentro = yardas >= c["min"]
        if c["max"] is not None:
            dentro &= yardas <= c["max"]
        salida[dentro] = c["valor"]
    return salida


def grupo_rushers(rushers: pd.Series) -> pd.Series:
    salida = pd.Series(pd.NA, index=rushers.index, dtype="object")
    for g in config.GRUPOS_RUSHERS:
        dentro = rushers >= g["min"]
        if g["max"] is not None:
            dentro &= rushers <= g["max"]
        salida[dentro] = g["valor"]
    return salida


def es_juego_neutral(cuarto: pd.Series, diferencia: pd.Series) -> pd.Series:
    return cuarto.isin(config.CUARTOS_NEUTRAL) & (diferencia.abs() <= config.DIFERENCIA_MAXIMA_NEUTRAL)


def unir_validando(izq: pd.DataFrame, der: pd.DataFrame, llaves: list[str], nombre: str) -> pd.DataFrame:
    """Left join que falla si cambia el número de filas (un join que duplica infla los conteos)."""
    antes = len(izq)
    unido = izq.merge(der, on=llaves, how="left", validate="m:1")
    if len(unido) != antes:
        raise ErrorDatos(f"El join {nombre} cambió las filas: {antes} -> {len(unido)}")
    return unido


def por_jugada_pff(pff: pd.DataFrame) -> pd.DataFrame:
    """Rushers y presión (golpe, apuro o sack de algún defensor) por jugada."""
    llave = ["partido", "jugada"]
    rushers = pff[pff.rol == ROL_RUSHER].groupby(llave).size().rename("rushers")
    defensa = pff[pff.rol.isin(ROLES_DEFENSA)]
    presion = (defensa[["golpe", "apuro", "sack"]].fillna(0).max(axis=1) > 0).groupby(
        [defensa.partido, defensa.jugada]).any().rename("presion")
    jugadas = pff[llave].drop_duplicates().set_index(llave)
    return jugadas.join(rushers).join(presion).fillna({"rushers": 0, "presion": False}).reset_index()


def preparar(tablas: dict[str, pd.DataFrame]) -> tuple[pd.DataFrame, dict]:
    """Una fila por jugada válida con su situación. Devuelve también los descartes y su motivo."""
    j = tablas["jugadas"]
    leidas = len(j)
    j = unir_validando(j, tablas["partidos"][["partido", "local", "temporada", "semana"]], ["partido"], "jugadas-partidos")
    j = unir_validando(j, por_jugada_pff(tablas["pff"]), ["partido", "jugada"], "jugadas-pff")

    descartes = {}
    motivos = {
        "sin partido en games": j.local.isna(),
        "sin datos de PFF": j.rushers.isna(),
        "down fuera de 1-4 (conversiones de 2 puntos)": ~j.down.isin([1, 2, 3, 4]),
        "yardas por avanzar menores a 1": j.yardas_por_avanzar < 1,
    }
    descartar = pd.Series(False, index=j.index)
    for motivo, mascara in motivos.items():
        nuevos = mascara & ~descartar
        descartes[motivo] = int(nuevos.sum())
        descartar |= mascara
    j = j[~descartar].copy()

    es_local = j.ataque == j.local
    j["diferencia"] = np.where(es_local, j.marcador_local - j.marcador_visita, j.marcador_visita - j.marcador_local)
    j["neutral"] = es_juego_neutral(j.cuarto, j.diferencia)
    j["down_c"] = cubeta_down(j.down)
    j["distancia_c"] = cubeta_distancia(j.yardas_por_avanzar)
    j["grupo_rushers"] = grupo_rushers(j.rushers)
    j["presion"] = j.presion.astype(int)
    j["blitz"] = (j.rushers >= config.UMBRAL_BLITZ).astype(int)

    resumen = {"filas_leidas": leidas, "jugadas_validas": len(j), "descartes": descartes}
    return j, resumen
