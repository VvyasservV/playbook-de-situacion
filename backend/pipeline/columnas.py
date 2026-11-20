"""Mapeo: nombre interno -> nombre en este dataset (NFL Big Data Bowl 2023, PFF).

Cambiar de fuente de datos es editar este archivo. El resto del código usa los nombres internos.
"""

ARCHIVOS = {
    "jugadas": "plays.csv",
    "partidos": "games.csv",
    "pff": "pffScoutingData.csv",
}

COLUMNAS = {
    "jugadas": {
        "partido": "gameId",
        "jugada": "playId",
        "cuarto": "quarter",
        "down": "down",
        "yardas_por_avanzar": "yardsToGo",
        "ataque": "possessionTeam",
        "defensa": "defensiveTeam",
        "marcador_local": "preSnapHomeScore",
        "marcador_visita": "preSnapVisitorScore",
    },
    "partidos": {
        "partido": "gameId",
        "temporada": "season",
        "semana": "week",
        "local": "homeTeamAbbr",
    },
    "pff": {
        "partido": "gameId",
        "jugada": "playId",
        "jugador": "nflId",
        "rol": "pff_role",
        "golpe": "pff_hit",
        "apuro": "pff_hurry",
        "sack": "pff_sack",
    },
}

LLAVES = {
    "jugadas": ["partido", "jugada"],
    "partidos": ["partido"],
    "pff": ["partido", "jugada", "jugador"],
}

# Valores de `rol` en este dataset
ROL_RUSHER = "Pass Rush"
ROLES_DEFENSA = ["Pass Rush", "Coverage"]
