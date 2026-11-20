import type { Hallazgo as HallazgoDatos, Meta } from '../api'
import { BORDE_CLARO, colorEquipo, esOscuro } from '../colores'
import { miles, pct, tasaConIntervalo } from '../formato'
import InsigniaEvidencia from './InsigniaEvidencia'

const NIVEL: Record<string, string> = { indicio: 'indicio', solida: 'sólida' }

// La comparación sale del título de la gráfica, que genera el backend a partir de la razón calculada
// (por ejemplo "casi el doble"). Así la palabra es la misma en los dos lugares.
const COMPARACION = /\s((?:casi )?(?:el doble|la mitad)|[\d.]+ veces más|\d+ puntos? (?:más|menos)) que el resto de la liga/

function Cifra({ valor, etiqueta, color, borde }: { valor: string; etiqueta: string; color: string; borde?: string }) {
  return (
    <div className="rounded-md border border-slate-700 bg-[#111c30] px-4 py-3" style={borde ? { borderTop: `4px solid ${borde}` } : undefined}>
      <p className="text-5xl font-black tabular-nums md:text-6xl" style={{ color }}>
        {valor}
      </p>
      <p className="mt-1 text-sm font-bold uppercase tracking-[0.15em] text-slate-300">{etiqueta}</p>
    </div>
  )
}

function Marcador({ h, meta }: { h: HallazgoDatos; meta: Meta }) {
  if (!h.situacion || !h.equipo || !h.resto_liga || !h.evidencia) return null
  const color = colorEquipo(meta, h.situacion.equipo)
  const grupo = meta.grupos_rushers.find((g) => g.valor === h.situacion?.grupo_rushers)?.etiqueta ?? ''
  const comparacion = h.grafica?.titulo.match(COMPARACION)?.[1]
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Cifra
        valor={pct(h.equipo.tasa)}
        etiqueta={`${h.situacion.equipo} · con ${grupo.toLowerCase()}`}
        color={esOscuro(color) ? BORDE_CLARO : color}
        borde={color}
      />
      <Cifra valor={pct(h.resto_liga.tasa)} etiqueta="Resto de la liga" color="#94a3b8" />
      <div className="rounded-md border border-slate-700 bg-[#111c30] px-4 py-3">
        {comparacion && <p className="text-3xl font-black uppercase leading-tight text-slate-100 md:text-4xl">{comparacion}</p>}
        <p className="mt-1 text-sm font-bold uppercase tracking-[0.15em] text-slate-300">
          n = {miles(h.equipo.n)} · {NIVEL[h.evidencia] ?? h.evidencia}
        </p>
      </div>
    </div>
  )
}

export default function Hallazgo({ h, meta }: { h: HallazgoDatos; meta: Meta }) {
  const { fino, agrupado } = meta.revision
  return (
    <section aria-labelledby="titulo-hallazgo" className="space-y-4">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-400">El hallazgo</p>
      <Marcador h={h} meta={meta} />
      <h1 id="titulo-hallazgo" className="text-3xl font-bold leading-tight md:text-4xl">
        {h.frase}
      </h1>
      {h.decision && <p className="text-2xl font-semibold text-sky-300">Decisión: {h.decision}</p>}

      <details className="rounded-md border border-slate-700 bg-[#0f1a2e] px-4 py-3">
        <summary className="cursor-pointer text-base font-bold uppercase tracking-[0.15em] text-sky-300">
          Ver detalle estadístico
        </summary>
        <div className="mt-3 space-y-3">
          {h.equipo && h.resto_liga && h.evidencia && (
            <div className="space-y-2 text-lg text-slate-300">
              <p>
                {h.equipo_nombre}: {tasaConIntervalo(h.equipo)}. Resto de la liga: {tasaConIntervalo(h.resto_liga)}.{' '}
                <InsigniaEvidencia evidencia={h.evidencia} n={h.equipo.n} />
              </p>
              {h.sin_filtro && (
                <p>
                  Sin el filtro de juego neutral: {tasaConIntervalo(h.sin_filtro.equipo)} contra{' '}
                  {tasaConIntervalo(h.sin_filtro.resto_liga)}.{' '}
                  <InsigniaEvidencia evidencia={h.sin_filtro.evidencia} n={h.sin_filtro.equipo.n} />
                </p>
              )}
              {h.respaldo && (
                <p>
                  Respaldo ({h.respaldo.descripcion.toLowerCase()}): {tasaConIntervalo(h.respaldo.equipo)} contra{' '}
                  {tasaConIntervalo(h.respaldo.resto_liga)}.{' '}
                  <InsigniaEvidencia evidencia={h.respaldo.evidencia} n={h.respaldo.equipo.n} />
                </p>
              )}
            </div>
          )}

          <p className="text-base text-slate-400">
            {fino.con_ventaja} de {fino.revisadas} situaciones revisadas tienen ventaja clara ({agrupado.con_ventaja} de{' '}
            {agrupado.revisadas} agrupando por down). {meta.definiciones.ventaja_clara} Solo cuentan situaciones con{' '}
            {meta.umbrales.n_minimo} jugadas o más.{' '}
            {meta.juego_neutral.aplicado
              ? `Juego neutral: ${meta.definiciones.juego_neutral.toLowerCase()}`
              : 'Limitación: con el filtro de juego neutral no quedaba muestra suficiente; se usa la muestra completa.'}
          </p>
        </div>
      </details>
    </section>
  )
}
