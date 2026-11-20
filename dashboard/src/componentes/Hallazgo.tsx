import type { Hallazgo as HallazgoDatos, Meta } from '../api'
import { tasaConIntervalo } from '../formato'
import InsigniaEvidencia from './InsigniaEvidencia'

export default function Hallazgo({ h, meta }: { h: HallazgoDatos; meta: Meta }) {
  const { fino, agrupado } = meta.revision
  return (
    <section aria-labelledby="titulo-hallazgo" className="space-y-4">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-400">El hallazgo</p>
      <h1 id="titulo-hallazgo" className="text-3xl font-bold leading-tight md:text-4xl">
        {h.frase}
      </h1>
      {h.decision && <p className="text-2xl font-semibold text-sky-300">Decisión: {h.decision}</p>}

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
    </section>
  )
}
