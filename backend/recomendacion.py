"""Reglas que convierten números en frases de coach. Toda comparación sale de los números calculados."""
from backend import config

_DOWNS = {d["valor"]: d for d in config.DOWNS}
_DISTANCIAS = {d["valor"]: d for d in config.DISTANCIAS}
_GRUPOS = {g["valor"]: g for g in config.GRUPOS_RUSHERS}

ETIQUETA_EVIDENCIA = {"indicio": "indicio", "solida": "evidencia sólida"}
MENSAJE_INSUFICIENTE = "Muestra insuficiente: no recomendamos con menos de 30 jugadas"
MENSAJE_SIN_DIFERENCIA = "Sin diferencia clara: los rangos se tocan con los del resto de la liga"


def porcentaje(x: float, decimales: int = 1) -> str:
    return f"{x * 100:.{decimales}f}%"


def puntos(diferencia: float) -> str:
    p = round(abs(diferencia) * 100)
    return f"{p} punto" if p == 1 else f"{p} puntos"


def comparativo(tasa: float, referencia: float) -> str:
    """Compara dos tasas en palabras a partir de su razón; si la razón no es expresiva, en puntos."""
    if tasa >= referencia:
        razon = tasa / referencia if referencia > 0 else float("inf")
        if 1.85 <= razon < 1.98:
            return "casi el doble que"
        if 1.98 <= razon < 2.15:
            return "el doble que"
        if 2.15 <= razon < float("inf"):
            return f"{razon:.1f} veces más que"
        return f"{puntos(tasa - referencia)} más que"
    razon = referencia / tasa if tasa > 0 else float("inf")
    if 1.85 <= razon < 1.98:
        return "casi la mitad que"
    if 1.98 <= razon < 2.15:
        return "la mitad que"
    return f"{puntos(referencia - tasa)} menos que"


def situacion_corta(down: str, distancia: str | None) -> str:
    """'2.º y largo'; sin distancia, '2.º down'."""
    if distancia is None or distancia == config.TODAS:
        return _DOWNS[down]["etiqueta"]
    return f"{_DOWNS[down]['corto']} y {_DISTANCIAS[distancia]['corto']}"


def frase_hallazgo(nombre: str, grupo: str, down: str, distancia: str, tasa: float, n: int, tasa_resto: float) -> str:
    return (f"Con {_GRUPOS[grupo]['corto']}, {nombre} permite presión en {porcentaje(tasa)} de sus pases de "
            f"{situacion_corta(down, distancia)} (n = {n}), contra {porcentaje(tasa_resto)} del resto de la liga.")


def titulo_grafica(nombre: str, grupo: str, down: str, distancia: str, tasa: float, tasa_resto: float) -> str:
    return (f"{nombre} permite presión con {_GRUPOS[grupo]['corto']} {comparativo(tasa, tasa_resto)} "
            f"el resto de la liga en {situacion_corta(down, distancia)}")


def decision(grupo: str, direccion: str) -> str:
    if grupo == "4_o_menos":
        if direccion == "mas_presion":
            return "Presiona con 4 y deja 7 en cobertura."
        return "Con 4 no llegas al QB: no cuentes con presión sin blitz."
    if direccion == "mas_presion":
        return "El blitz rinde: llega al QB más que contra el resto de la liga."
    return "Evita el blitz: este ataque lo contiene mejor que el resto de la liga."


def _prefijo(grupo: str, direccion: str) -> str:
    if grupo == "4_o_menos":
        return "Presiona con 4" if direccion == "mas_presion" else "Con 4 no llegas"
    return "El blitz rinde" if direccion == "mas_presion" else "Evita el blitz"


def recomendacion_tarjeta(nombre: str, grupo: str, direccion: str, tasa: float, tasa_resto: float,
                          evidencia: str, n: int) -> str:
    return (f"{_prefijo(grupo, direccion)}: con {_GRUPOS[grupo]['corto']} {nombre} permite presión en "
            f"{porcentaje(tasa, 0)} de estos pases, contra {porcentaje(tasa_resto, 0)} del resto de la liga "
            f"({ETIQUETA_EVIDENCIA[evidencia]}, n = {n}).")


def mensaje_sin_recomendacion(evidencias: list[str]) -> str:
    if all(e == "insuficiente" for e in evidencias):
        return MENSAJE_INSUFICIENTE
    return MENSAJE_SIN_DIFERENCIA
