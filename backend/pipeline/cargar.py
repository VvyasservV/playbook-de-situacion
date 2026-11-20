"""Lectura y validación de los datos crudos. Solo lee: nunca modifica data/."""
from pathlib import Path

import pandas as pd

from backend.pipeline.columnas import ARCHIVOS, COLUMNAS, LLAVES


class ErrorDatos(Exception):
    """Los datos crudos no tienen la forma que espera la tubería."""


def cargar_tabla(ruta_datos: Path, tabla: str) -> pd.DataFrame:
    """Lee solo las columnas mapeadas, las renombra a nombres internos y valida la llave."""
    ruta = ruta_datos / ARCHIVOS[tabla]
    if not ruta.exists():
        raise ErrorDatos(f"Falta el archivo {ruta.name} en {ruta_datos}")
    mapeo = COLUMNAS[tabla]
    disponibles = pd.read_csv(ruta, nrows=0).columns
    faltan = [c for c in mapeo.values() if c not in disponibles]
    if faltan:
        raise ErrorDatos(f"{ruta.name}: faltan columnas requeridas {faltan}. "
                         f"Edita backend/pipeline/columnas.py si cambiaron de nombre.")
    df = pd.read_csv(ruta, usecols=list(mapeo.values()))
    df = df.rename(columns={v: k for k, v in mapeo.items()})
    duplicados = int(df.duplicated(LLAVES[tabla]).sum())
    if duplicados:
        raise ErrorDatos(f"{ruta.name}: {duplicados} filas repiten la llave {LLAVES[tabla]}")
    return df


def cargar_todo(ruta_datos: Path) -> dict[str, pd.DataFrame]:
    return {tabla: cargar_tabla(ruta_datos, tabla) for tabla in ARCHIVOS}
