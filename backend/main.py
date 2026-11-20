"""API del Playbook de Situación. Ejecuta: .venv\\Scripts\\python -m uvicorn backend.main:app --reload"""
from fastapi import FastAPI, HTTPException, Query

from backend import config, consultas
from backend.modelos import Hallazgo, Meta, Reporte, Tarjeta

app = FastAPI(title="Hackathon NFL UNAM")

# Los agregados se cargan una sola vez al arrancar. Si faltan, /health sigue respondiendo.
try:
    AGREGADOS: consultas.Agregados | None = consultas.Agregados(config.ARCHIVO_CELDAS, config.ARCHIVO_RESUMEN)
    ERROR_CARGA = None
except consultas.SinDatos as e:
    AGREGADOS, ERROR_CARGA = None, str(e)

DOWNS_VALIDOS = [d["valor"] for d in config.DOWNS]
DISTANCIAS_VALIDAS = [d["valor"] for d in config.DISTANCIAS]


def _agregados() -> consultas.Agregados:
    if AGREGADOS is None:
        raise HTTPException(status_code=503, detail=ERROR_CARGA)
    return AGREGADOS


def _validar_equipo(a: consultas.Agregados, equipo: str) -> str:
    equipo = equipo.upper()
    if equipo not in a.equipos:
        raise HTTPException(status_code=404, detail=f"Equipo no encontrado: {equipo}")
    return equipo


def _validar_valor(nombre: str, valor: str, validos: list[str]) -> None:
    if valor not in validos:
        raise HTTPException(status_code=422, detail=f"{nombre} inválido: {valor}. Valores: {validos}")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/meta", response_model=Meta)
def api_meta() -> Meta:
    return consultas.meta(_agregados())


@app.get("/api/hallazgo", response_model=Hallazgo)
def api_hallazgo() -> Hallazgo:
    return consultas.hallazgo(_agregados())


@app.get("/api/reporte", response_model=Reporte)
def api_reporte(equipo: str = Query(..., description="Abreviatura del equipo, por ejemplo CAR")) -> Reporte:
    a = _agregados()
    return consultas.reporte(a, _validar_equipo(a, equipo))


@app.get("/api/situacion", response_model=Tarjeta)
def api_situacion(equipo: str = Query(...), down: str = Query(...), distancia: str = Query(...)) -> Tarjeta:
    a = _agregados()
    equipo = _validar_equipo(a, equipo)
    _validar_valor("down", down, DOWNS_VALIDOS)
    _validar_valor("distancia", distancia, DISTANCIAS_VALIDAS)
    return consultas.tarjeta(a, equipo, down, distancia)
