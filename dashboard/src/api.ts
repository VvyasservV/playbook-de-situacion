// Tipos que reflejan backend/modelos.py y llamadas a la API (rutas relativas, sin diagonal inicial).

export type Evidencia = 'insuficiente' | 'sin_diferencia' | 'indicio' | 'solida'
export type Direccion = 'mas_presion' | 'menos_presion'
export type Intervalo = [number, number]

export interface Opcion {
  valor: string
  etiqueta: string
}

export interface OpcionRango extends Opcion {
  min: number
  max: number | null
}

export interface EquipoOpcion {
  valor: string
  nombre: string
  color: string | null
}

export interface Conteo {
  revisadas: number
  con_ventaja: number
}

export interface ConteoNivel extends Conteo {
  descripcion: string
}

export interface Meta {
  equipos: EquipoOpcion[]
  downs: Opcion[]
  distancias: OpcionRango[]
  grupos_rushers: OpcionRango[]
  umbrales: { n_minimo: number; n_solida: number; confianza: number }
  definiciones: Record<string, string>
  juego_neutral: { aplicado: boolean; cuartos: number[]; diferencia_maxima: number }
  cobertura: { temporadas: number[]; semana_min: number; semana_max: number; partidos: number; jugadas: number }
  revision: { fino: ConteoNivel; agrupado: ConteoNivel }
  generado: string
}

export interface Tasa {
  n: number
  exitos: number
  tasa: number | null
  ic95: Intervalo | null
}

export interface Comparacion {
  grupo_rushers: string
  metrica: string
  equipo: Tasa
  resto_liga: Tasa
  ventaja_clara: number | null
  direccion: Direccion | null
  evidencia: Evidencia
}

export interface Tarjeta {
  situacion: { equipo: string; down: string; distancia: string }
  situacion_corta: string
  equipo_nombre: string
  juego_neutral: boolean
  n: number
  tendencia: { etiqueta: string; equipo: Tasa; resto_liga: Tasa }
  comparaciones: Comparacion[]
  recomendacion: string | null
  recomendacion_corta: string | null
  mensaje: string | null
}

export interface Reporte {
  equipo: string
  equipo_nombre: string
  juego_neutral: boolean
  revision_equipo: Conteo
  revision_liga: Conteo
  tarjetas: Tarjeta[]
}

export interface SituacionHallazgo {
  equipo: string
  down: string
  distancia: string | null
  grupo_rushers: string
}

export interface SinFiltro {
  equipo: Tasa
  resto_liga: Tasa
  ventaja_clara: number | null
  evidencia: Evidencia
}

export interface Respaldo extends SinFiltro {
  descripcion: string
  situacion: SituacionHallazgo
}

export interface FilaGrafica {
  etiqueta: string
  tasa: number | null
  ic95: Intervalo | null
  n: number
}

export interface Grafica {
  titulo: string
  eje: string
  filas: FilaGrafica[]
  hueco: Intervalo | null
}

export interface Hallazgo {
  frase: string
  decision: string | null
  equipo_nombre: string | null
  situacion: SituacionHallazgo | null
  juego_neutral: boolean
  equipo: Tasa | null
  resto_liga: Tasa | null
  ventaja_clara: number | null
  direccion: Direccion | null
  evidencia: Evidencia | null
  sin_filtro: SinFiltro | null
  respaldo: Respaldo | null
  grafica: Grafica | null
  revision: Conteo
}

async function obtener<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`api/${ruta}`)
  if (!respuesta.ok) {
    let detalle = `Error ${respuesta.status}`
    try {
      const cuerpo: { detail?: unknown } = await respuesta.json()
      if (typeof cuerpo.detail === 'string') detalle = cuerpo.detail
    } catch {
      // la respuesta no era JSON: se queda el código de estado
    }
    throw new Error(detalle)
  }
  return (await respuesta.json()) as T
}

export const api = {
  meta: () => obtener<Meta>('meta'),
  hallazgo: () => obtener<Hallazgo>('hallazgo'),
  reporte: (equipo: string) => obtener<Reporte>(`reporte?equipo=${encodeURIComponent(equipo)}`),
  situacion: (equipo: string, down: string, distancia: string) =>
    obtener<Tarjeta>(
      `situacion?equipo=${encodeURIComponent(equipo)}&down=${encodeURIComponent(down)}&distancia=${encodeURIComponent(distancia)}`,
    ),
}
