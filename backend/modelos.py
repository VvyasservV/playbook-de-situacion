"""Modelos de Pydantic: el contrato con el dashboard (docs/contrato-api.md)."""
from typing import Literal

from pydantic import BaseModel

Evidencia = Literal["insuficiente", "sin_diferencia", "indicio", "solida"]
Direccion = Literal["mas_presion", "menos_presion"]


class Opcion(BaseModel):
    valor: str
    etiqueta: str


class OpcionRango(Opcion):
    min: int
    max: int | None


class EquipoOpcion(BaseModel):
    valor: str
    nombre: str


class Umbrales(BaseModel):
    n_minimo: int
    n_solida: int
    confianza: float


class JuegoNeutral(BaseModel):
    aplicado: bool
    cuartos: list[int]
    diferencia_maxima: int


class Cobertura(BaseModel):
    temporadas: list[int]
    semana_min: int
    semana_max: int
    partidos: int
    jugadas: int


class Conteo(BaseModel):
    revisadas: int
    con_ventaja: int


class ConteoNivel(Conteo):
    descripcion: str


class Revision(BaseModel):
    fino: ConteoNivel
    agrupado: ConteoNivel


class Meta(BaseModel):
    equipos: list[EquipoOpcion]
    downs: list[Opcion]
    distancias: list[OpcionRango]
    grupos_rushers: list[OpcionRango]
    umbrales: Umbrales
    definiciones: dict[str, str]
    juego_neutral: JuegoNeutral
    cobertura: Cobertura
    revision: Revision
    generado: str


class Tasa(BaseModel):
    n: int
    exitos: int
    tasa: float | None
    ic95: tuple[float, float] | None


class Comparacion(BaseModel):
    grupo_rushers: str
    metrica: str
    equipo: Tasa
    resto_liga: Tasa
    ventaja_clara: float | None
    direccion: Direccion | None
    evidencia: Evidencia


class Tendencia(BaseModel):
    etiqueta: str
    equipo: Tasa
    resto_liga: Tasa


class SituacionTarjeta(BaseModel):
    equipo: str
    down: str
    distancia: str


class Tarjeta(BaseModel):
    situacion: SituacionTarjeta
    situacion_corta: str
    equipo_nombre: str
    juego_neutral: bool
    n: int
    tendencia: Tendencia
    comparaciones: list[Comparacion]
    recomendacion: str | None
    recomendacion_corta: str | None
    mensaje: str | None


class Reporte(BaseModel):
    equipo: str
    equipo_nombre: str
    juego_neutral: bool
    revision_equipo: Conteo
    revision_liga: Conteo
    tarjetas: list[Tarjeta]


class SituacionHallazgo(BaseModel):
    equipo: str
    down: str
    distancia: str | None
    grupo_rushers: str


class SinFiltro(BaseModel):
    equipo: Tasa
    resto_liga: Tasa
    ventaja_clara: float | None
    evidencia: Evidencia


class Respaldo(SinFiltro):
    descripcion: str
    situacion: SituacionHallazgo


class FilaGrafica(BaseModel):
    etiqueta: str
    tasa: float | None
    ic95: tuple[float, float] | None
    n: int


class Grafica(BaseModel):
    titulo: str
    eje: str
    filas: list[FilaGrafica]
    hueco: tuple[float, float] | None


class Hallazgo(BaseModel):
    frase: str
    decision: str | None
    equipo_nombre: str | None
    situacion: SituacionHallazgo | None
    juego_neutral: bool
    equipo: Tasa | None
    resto_liga: Tasa | None
    ventaja_clara: float | None
    direccion: Direccion | None
    evidencia: Evidencia | None
    sin_filtro: SinFiltro | None
    respaldo: Respaldo | None
    grafica: Grafica | None
    revision: Conteo
