"""Arma las respuestas de la API a partir de los agregados de data/procesado (no recalcula nada)."""
import json
import math
from pathlib import Path

import pandas as pd

from backend import config, recomendacion
from backend.modelos import (Comparacion, Conteo, ConteoNivel, Grafica, FilaGrafica, Hallazgo, Meta, Reporte,
                             Respaldo, Revision, SinFiltro, SituacionHallazgo, SituacionTarjeta, Tarjeta, Tasa,
                             Tendencia)

DECIMALES = 4
LLAVE = ["muestra", "nivel", "metrica", "equipo", "down", "distancia", "grupo_rushers"]
DESCRIPCION_NIVEL = {"fino": "rushers × down × distancia", "agrupado": "rushers × down"}


class SinDatos(Exception):
    """No existen los agregados: hay que ejecutar la tubería."""


class Agregados:
    def __init__(self, celdas: Path, resumen: Path):
        if not celdas.exists() or not resumen.exists():
            raise SinDatos("Faltan los agregados. Ejecuta: .venv\\Scripts\\python -m backend.pipeline.ejecutar")
        df = pd.read_csv(celdas, dtype={"down": str, "equipo": str})
        self.celdas = {tuple(f[k] for k in LLAVE): f for f in df.to_dict("records")}
        self.resumen = json.loads(resumen.read_text(encoding="utf-8"))
        self.principal = self.resumen["muestra_principal"]
        self.neutral = self.principal == "neutral"
        self.equipos = self.resumen["cobertura"]["equipos"]

    def celda(self, muestra: str, nivel: str, metrica: str, equipo: str, down: str, distancia: str,
              grupo: str) -> dict:
        return self.celdas[(muestra, nivel, metrica, equipo, down, distancia, grupo)]


# --- Conversión de filas a modelos ---

def _num(x) -> float | None:
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else round(float(x), DECIMALES)


def _tasa(c: dict, resto: bool = False) -> Tasa:
    s = "_resto" if resto else ""
    inf, sup = _num(c[f"ic{s}_inf"]), _num(c[f"ic{s}_sup"])
    return Tasa(n=int(c[f"n{s}"]), exitos=int(c[f"exitos{s}"]), tasa=_num(c[f"tasa{s}"]),
                ic95=(inf, sup) if inf is not None and sup is not None else None)


def _tiene_ventaja(c: dict) -> bool:
    return c["evidencia"] in ("indicio", "solida")


def _direccion(c: dict) -> str | None:
    if not _tiene_ventaja(c):
        return None
    return "mas_presion" if c["tasa"] > c["tasa_resto"] else "menos_presion"


def _ventaja(c: dict) -> float | None:
    return None if c["evidencia"] == "insuficiente" else _num(c["ventaja"])


def _comparacion(c: dict) -> Comparacion:
    return Comparacion(grupo_rushers=c["grupo_rushers"], metrica="tasa de presión permitida",
                       equipo=_tasa(c), resto_liga=_tasa(c, resto=True), ventaja_clara=_ventaja(c),
                       direccion=_direccion(c), evidencia=c["evidencia"])


# --- Respuestas ---

def meta(a: Agregados) -> Meta:
    r = a.resumen
    rev = r["revision"][a.principal]
    cob = r["cobertura"]
    return Meta(
        equipos=[{"valor": e, "nombre": config.nombre_equipo(e), "color": config.COLORES_EQUIPOS.get(e)}
                 for e in a.equipos],
        downs=[{"valor": d["valor"], "etiqueta": d["etiqueta"]} for d in config.DOWNS],
        distancias=[{k: d[k] for k in ("valor", "etiqueta", "min", "max")} for d in config.DISTANCIAS],
        grupos_rushers=[{k: g[k] for k in ("valor", "etiqueta", "min", "max")} for g in config.GRUPOS_RUSHERS],
        umbrales={"n_minimo": config.N_MINIMO, "n_solida": config.N_SOLIDA, "confianza": config.CONFIANZA},
        definiciones=config.DEFINICIONES,
        juego_neutral=r["juego_neutral"],
        cobertura={k: cob[k] for k in ("temporadas", "semana_min", "semana_max", "partidos", "jugadas")},
        revision=Revision(**{n: ConteoNivel(descripcion=DESCRIPCION_NIVEL[n], **rev[n]) for n in ("fino", "agrupado")}),
        generado=r["generado"],
    )


def tarjeta(a: Agregados, equipo: str, down: str, distancia: str) -> Tarjeta:
    nombre = config.nombre_equipo(equipo)
    celdas = [a.celda(a.principal, "fino", "presion", equipo, down, distancia, g["valor"])
              for g in config.GRUPOS_RUSHERS]
    blitz = a.celda(a.principal, "fino", "blitz_recibido", equipo, down, distancia, config.TODOS)

    con_ventaja = [c for c in celdas if _tiene_ventaja(c)]
    if con_ventaja:
        mejor = max(con_ventaja, key=lambda c: c["ventaja"])
        texto = recomendacion.recomendacion_tarjeta(nombre, mejor["grupo_rushers"], _direccion(mejor), mejor["tasa"],
                                                    mejor["tasa_resto"], mejor["evidencia"], int(mejor["n"]))
        corta = recomendacion.recomendacion_corta(mejor["grupo_rushers"], _direccion(mejor))
        mensaje = None
    else:
        texto = corta = None
        mensaje = recomendacion.mensaje_sin_recomendacion([c["evidencia"] for c in celdas])

    return Tarjeta(
        situacion=SituacionTarjeta(equipo=equipo, down=down, distancia=distancia),
        situacion_corta=recomendacion.situacion_corta(down, distancia),
        recomendacion_corta=corta,
        equipo_nombre=nombre,
        juego_neutral=a.neutral,
        n=int(blitz["n"]),
        tendencia=Tendencia(etiqueta="La liga le manda blitz", equipo=_tasa(blitz), resto_liga=_tasa(blitz, resto=True)),
        comparaciones=[_comparacion(c) for c in celdas],
        recomendacion=texto,
        mensaje=mensaje,
    )


def reporte(a: Agregados, equipo: str) -> Reporte:
    candidatas = []
    revisadas = con_ventaja = 0
    for d in config.DOWNS:
        for dist in config.DISTANCIAS:
            celdas = [a.celda(a.principal, "fino", "presion", equipo, d["valor"], dist["valor"], g["valor"])
                      for g in config.GRUPOS_RUSHERS]
            revisadas += sum(c["n"] >= config.N_MINIMO for c in celdas)
            ventajas = [c["ventaja"] for c in celdas if _tiene_ventaja(c)]
            con_ventaja += len(ventajas)
            if ventajas:
                candidatas.append((max(ventajas), d["valor"], dist["valor"]))
    candidatas.sort(reverse=True)
    liga = a.resumen["revision"][a.principal]["fino"]
    return Reporte(
        equipo=equipo,
        equipo_nombre=config.nombre_equipo(equipo),
        juego_neutral=a.neutral,
        revision_equipo=Conteo(revisadas=revisadas, con_ventaja=con_ventaja),
        revision_liga=Conteo(**liga),
        tarjetas=[tarjeta(a, equipo, d, dist) for _, d, dist in candidatas],
    )


def hallazgo(a: Agregados) -> Hallazgo:
    revision = Conteo(**a.resumen["revision"][a.principal]["fino"])
    h = a.resumen["hallazgo"]
    if h is None:
        return Hallazgo(frase="Ninguna situación se separa del resto de la liga con evidencia suficiente.",
                        decision=None, equipo_nombre=None, situacion=None, juego_neutral=a.neutral, equipo=None,
                        resto_liga=None, ventaja_clara=None, direccion=None, evidencia=None, sin_filtro=None,
                        respaldo=None, grafica=None, revision=revision)

    equipo, down, dist, grupo = h["equipo"], h["down"], h["distancia"], h["grupo_rushers"]
    nombre = config.nombre_equipo(equipo)
    c = a.celda(a.principal, "fino", "presion", equipo, down, dist, grupo)
    direccion = _direccion(c)

    sin_filtro = None
    if a.principal != "completa":
        s = a.celda("completa", "fino", "presion", equipo, down, dist, grupo)
        sin_filtro = SinFiltro(equipo=_tasa(s), resto_liga=_tasa(s, resto=True), ventaja_clara=_ventaja(s),
                               evidencia=s["evidencia"])

    r = a.celda(a.principal, "agrupado", "presion", equipo, down, config.TODAS, grupo)
    respaldo = None
    if _tiene_ventaja(r) and _direccion(r) == direccion:
        respaldo = Respaldo(descripcion="Mismo equipo y down, todas las distancias",
                            situacion=SituacionHallazgo(equipo=equipo, down=down, distancia=None, grupo_rushers=grupo),
                            equipo=_tasa(r), resto_liga=_tasa(r, resto=True), ventaja_clara=_ventaja(r),
                            evidencia=r["evidencia"])

    eq, resto = _tasa(c), _tasa(c, resto=True)
    if direccion == "mas_presion":
        hueco = (resto.ic95[1], eq.ic95[0])
    else:
        hueco = (eq.ic95[1], resto.ic95[0])
    grafica = Grafica(
        titulo=recomendacion.titulo_grafica(nombre, grupo, down, dist, c["tasa"], c["tasa_resto"]),
        eje="Tasa de presión permitida (%)",
        filas=[FilaGrafica(etiqueta=nombre, tasa=eq.tasa, ic95=eq.ic95, n=eq.n),
               FilaGrafica(etiqueta="Resto de la liga", tasa=resto.tasa, ic95=resto.ic95, n=resto.n)],
        hueco=hueco,
    )
    return Hallazgo(
        frase=recomendacion.frase_hallazgo(nombre, grupo, down, dist, c["tasa"], int(c["n"]), c["tasa_resto"]),
        decision=recomendacion.decision(grupo, direccion),
        equipo_nombre=nombre,
        situacion=SituacionHallazgo(equipo=equipo, down=down, distancia=dist, grupo_rushers=grupo),
        juego_neutral=a.neutral,
        equipo=eq, resto_liga=resto, ventaja_clara=_ventaja(c), direccion=direccion, evidencia=c["evidencia"],
        sin_filtro=sin_filtro, respaldo=respaldo, grafica=grafica, revision=revision,
    )
