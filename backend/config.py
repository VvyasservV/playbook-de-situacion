"""Umbrales y definiciones de fútbol en un solo lugar. El dashboard los recibe por api/meta."""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
RUTA_DATOS = RAIZ / "data"
RUTA_PROCESADO = RUTA_DATOS / "procesado"
ARCHIVO_CELDAS = RUTA_PROCESADO / "celdas.csv"
ARCHIVO_RESUMEN = RUTA_PROCESADO / "resumen.json"

# Rigor estadístico
Z_95 = 1.96
CONFIANZA = 0.95
N_MINIMO = 30  # debajo: muestra insuficiente, no se recomienda
N_SOLIDA = 50  # desde aquí la evidencia es sólida (si hay ventaja clara)

# Juego neutral: el marcador no empuja la decisión
CUARTOS_NEUTRAL = (1, 2, 3)
DIFERENCIA_MAXIMA_NEUTRAL = 8

# Blitz = 5 o más rushers
UMBRAL_BLITZ = 5

# Cubetas. "corto" es la palabra para frases del tipo "2.º y largo".
DOWNS = [
    {"valor": "1", "etiqueta": "1.er down", "corto": "1.º", "downs": [1]},
    {"valor": "2", "etiqueta": "2.º down", "corto": "2.º", "downs": [2]},
    {"valor": "3-4", "etiqueta": "3.º y 4.º down", "corto": "3.º/4.º", "downs": [3, 4]},
]
DISTANCIAS = [
    {"valor": "corta", "etiqueta": "Corta (1-2 yardas)", "corto": "corto", "min": 1, "max": 2},
    {"valor": "media", "etiqueta": "Media (3-6 yardas)", "corto": "medio", "min": 3, "max": 6},
    {"valor": "larga", "etiqueta": "Larga (7 o más)", "corto": "largo", "min": 7, "max": None},
]
GRUPOS_RUSHERS = [
    {"valor": "4_o_menos", "etiqueta": "4 rushers o menos", "corto": "4 rushers o menos",
     "min": 0, "max": UMBRAL_BLITZ - 1},
    {"valor": "blitz", "etiqueta": f"Blitz ({UMBRAL_BLITZ} o más)", "corto": "blitz",
     "min": UMBRAL_BLITZ, "max": None},
]
TODAS = "todas"  # distancia en el nivel agrupado
TODOS = "todos"  # grupo de rushers en la métrica blitz_recibido

DEFINICIONES = {
    "presion": "La jugada terminó en golpe, apuro o sack al QB, según PFF.",
    "blitz": f"La defensa manda {UMBRAL_BLITZ} o más rushers.",
    "juego_neutral": "Cuartos 1 a 3 y diferencia de marcador de 8 puntos o menos.",
    "ventaja_clara": "Solo mostramos diferencias donde los rangos no se tocan.",
    "referencia": "Resto de la liga, sin el equipo, en la misma situación.",
}

# Diccionario de nombres (no es una elección de datos). Nombres de la temporada 2021.
NOMBRES_EQUIPOS = {
    "ARI": "Arizona Cardinals", "ATL": "Atlanta Falcons", "BAL": "Baltimore Ravens",
    "BUF": "Buffalo Bills", "CAR": "Carolina Panthers", "CHI": "Chicago Bears",
    "CIN": "Cincinnati Bengals", "CLE": "Cleveland Browns", "DAL": "Dallas Cowboys",
    "DEN": "Denver Broncos", "DET": "Detroit Lions", "GB": "Green Bay Packers",
    "HOU": "Houston Texans", "IND": "Indianapolis Colts", "JAX": "Jacksonville Jaguars",
    "KC": "Kansas City Chiefs", "LA": "Los Angeles Rams", "LAC": "Los Angeles Chargers",
    "LV": "Las Vegas Raiders", "MIA": "Miami Dolphins", "MIN": "Minnesota Vikings",
    "NE": "New England Patriots", "NO": "New Orleans Saints", "NYG": "New York Giants",
    "NYJ": "New York Jets", "PHI": "Philadelphia Eagles", "PIT": "Pittsburgh Steelers",
    "SEA": "Seattle Seahawks", "SF": "San Francisco 49ers", "TB": "Tampa Bay Buccaneers",
    "TEN": "Tennessee Titans", "WAS": "Washington Football Team",
}


# Color primario de cada equipo (diccionario fijo, como los nombres). Solo para acentos de la interfaz.
COLORES_EQUIPOS = {
    "ARI": "#97233F", "ATL": "#A71930", "BAL": "#241773", "BUF": "#00338D", "CAR": "#0085CA",
    "CHI": "#0B162A", "CIN": "#FB4F14", "CLE": "#311D00", "DAL": "#003594", "DEN": "#FB4F14",
    "DET": "#0076B6", "GB": "#203731", "HOU": "#03202F", "IND": "#002C5F", "JAX": "#006778",
    "KC": "#E31837", "LA": "#003594", "LAC": "#0080C6", "LV": "#000000", "MIA": "#008E97",
    "MIN": "#4F2683", "NE": "#002244", "NO": "#D3BC8D", "NYG": "#0B2265", "NYJ": "#125740",
    "PHI": "#004C54", "PIT": "#FFB612", "SEA": "#002244", "SF": "#AA0000", "TB": "#D50A0A",
    "TEN": "#0C2340", "WAS": "#5A1414",
}


def nombre_equipo(abreviatura: str) -> str:
    """'CAR' -> 'Carolina Panthers (CAR)'. Si no está en el diccionario, solo la abreviatura."""
    nombre = NOMBRES_EQUIPOS.get(abreviatura)
    return f"{nombre} ({abreviatura})" if nombre else abreviatura
