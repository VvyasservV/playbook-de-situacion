"""Pruebas de las métricas con casos calculados a mano. Un error aquí invalida el hallazgo."""
import numpy as np
import pandas as pd
import pytest

from backend.pipeline.metricas import comparar_contra_resto, evidencia, ventaja_clara, wilson


def test_wilson_casos_a_mano():
    # 5 de 10: centro 0.5; margen = 1.96 * sqrt(0.025 + 0.009604) / 1.38416 = 0.263409
    inf, sup = wilson(5, 10)
    assert float(inf) == pytest.approx(0.236591, abs=1e-5)
    assert float(sup) == pytest.approx(0.763409, abs=1e-5)
    # 0 de 10: inferior 0; superior = 0.38416 / 1.38416 = 0.277540
    inf, sup = wilson(0, 10)
    assert float(inf) == 0.0
    assert float(sup) == pytest.approx(0.277540, abs=1e-5)
    # n = 0: no hay intervalo
    inf, sup = wilson(0, 0)
    assert np.isnan(inf) and np.isnan(sup)


def test_ventaja_clara_arriba_abajo_y_traslape():
    # Equipo arriba: 0.50 - 0.40 = 0.10
    assert float(ventaja_clara(0.6, 0.5, 0.7, 0.35, 0.3, 0.4)) == pytest.approx(0.10)
    # Equipo abajo: 0.30 - 0.25 = 0.05
    assert float(ventaja_clara(0.2, 0.15, 0.25, 0.35, 0.3, 0.4)) == pytest.approx(0.05)
    # Rangos que se tocan: 0.35 - 0.40 = -0.05, no es ventaja clara
    assert float(ventaja_clara(0.45, 0.35, 0.55, 0.35, 0.3, 0.4)) == pytest.approx(-0.05)


def test_niveles_de_evidencia():
    n = [29, 30, 49, 50, 80]
    ventaja = [0.2, 0.01, 0.01, 0.01, -0.02]
    assert list(evidencia(n, ventaja)) == ["insuficiente", "indicio", "indicio", "solida", "sin_diferencia"]


def test_el_equipo_no_esta_en_su_propia_referencia():
    # Misma situación: A presiona en 10 de 10, B en 0 de 10, C en 5 de 10.
    df = pd.DataFrame({
        "equipo": ["A"] * 10 + ["B"] * 10 + ["C"] * 10,
        "down": ["2"] * 30,
        "exito": [1] * 10 + [0] * 10 + [1] * 5 + [0] * 5,
    })
    t = comparar_contra_resto(df, "equipo", ["down"], "exito").set_index("equipo")
    # La referencia de A son solo B y C: 5 de 20
    assert t.loc["A", "n_resto"] == 20
    assert t.loc["A", "exitos_resto"] == 5
    assert t.loc["A", "tasa_resto"] == pytest.approx(0.25)
    # La de B son A y C: 15 de 20
    assert t.loc["B", "tasa_resto"] == pytest.approx(0.75)
    # Equipo + resto = total de la situación
    assert (t.n + t.n_resto == 30).all()


def test_rejilla_completa_con_equipo_sin_jugadas():
    df = pd.DataFrame({"equipo": ["A", "B"], "down": ["1", "1"], "exito": [1, 0]})
    universo = {"equipo": ["A", "B", "C"], "down": ["1", "2"]}
    t = comparar_contra_resto(df, "equipo", ["down"], "exito", universo).set_index(["equipo", "down"])
    assert len(t) == 6
    assert t.loc[("C", "1"), "n"] == 0
    assert t.loc[("C", "1"), "n_resto"] == 2
    assert t.loc[("C", "1"), "evidencia"] == "insuficiente"
