import type { Comparacion, Direccion, Meta, Tarjeta } from '../api'
import { BORDE_CLARO, esOscuro } from '../colores'
import { pct, tasaConIntervalo } from '../formato'
import InsigniaEvidencia from './InsigniaEvidencia'

// Verde y rojo solo para "mejor" y "peor" desde el punto de vista de tu defensa, siempre con texto e icono.
const DIRECCION: Record<Direccion, { texto: string; clase: string }> = {
  mas_presion: { texto: '▲ Permite más presión que la liga', clase: 'text-emerald-300' },
  menos_presion: { texto: '▼ Permite menos presión que la liga', clase: 'text-rose-300' },
}

function etiqueta(lista: { valor: string; etiqueta: string }[], valor: string): string {
  return lista.find((o) => o.valor === valor)?.etiqueta ?? valor
}

function FilaComparacion({ c, meta }: { c: Comparacion; meta: Meta }) {
  return (
    <li className="space-y-1 border-t border-slate-700/70 pt-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold uppercase tracking-[0.15em] text-slate-300">
          {etiqueta(meta.grupos_rushers, c.grupo_rushers)}
        </span>
        <InsigniaEvidencia evidencia={c.evidencia} n={c.equipo.n} />
        {c.direccion && <span className={`text-base font-medium ${DIRECCION[c.direccion].clase}`}>{DIRECCION[c.direccion].texto}</span>}
      </div>
      <p className="text-base text-slate-300">
        Equipo: {tasaConIntervalo(c.equipo)} · Resto de la liga: {tasaConIntervalo(c.resto_liga)}
      </p>
    </li>
  )
}

// `color` null = tarjeta exploratoria: sin color de equipo y con el número en gris.
export default function TarjetaSituacion({ t, meta, color }: { t: Tarjeta; meta: Meta; color: string | null }) {
  const clave = t.comparaciones.find((c) => c.direccion !== null) ?? t.comparaciones[0]
  const situacion = `${etiqueta(meta.downs, t.situacion.down)} · ${etiqueta(meta.distancias, t.situacion.distancia)}`
  // Tarjeta destacada (con recomendación): borde izquierdo con el color del equipo y contorno claro si es oscuro
  const destacada = t.recomendacion && color
    ? { borderLeft: `6px solid ${color}`, boxShadow: esOscuro(color) ? `-2px 0 0 0 ${BORDE_CLARO}` : undefined }
    : undefined
  // Sin color (tarjeta exploratoria) o con muestra insuficiente, el número queda en gris y pequeño
  const gris = color === null || clave?.evidencia === 'insuficiente'

  return (
    <article className="space-y-3 rounded-md border border-slate-700 bg-[#111c30] p-4" style={destacada}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-base font-extrabold uppercase tracking-[0.15em] text-slate-100">{situacion}</span>
        <span className="text-sm font-bold uppercase tracking-[0.15em] text-slate-400">{t.equipo_nombre} en ataque</span>
      </header>

      {t.recomendacion ? (
        <p className="text-xl font-semibold leading-snug text-slate-50">{t.recomendacion}</p>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-500 p-3 text-xl font-bold text-slate-50">
          {t.mensaje}
        </p>
      )}

      {clave && clave.equipo.n > 0 && (
        <p className="flex flex-wrap items-baseline gap-x-3">
          {/* Con el número en gris, lo principal es el mensaje */}
          <span className={gris ? 'text-lg font-medium text-slate-500' : 'text-5xl font-black tabular-nums text-sky-300'}>
            {pct(clave.equipo.tasa, 0)}
          </span>
          <span className={gris ? 'text-base text-slate-500' : 'text-lg text-slate-300'}>
            presión permitida con {etiqueta(meta.grupos_rushers, clave.grupo_rushers).toLowerCase()}, contra{' '}
            {pct(clave.resto_liga.tasa, 0)} del resto de la liga
          </span>
        </p>
      )}

      <ul className="space-y-3">
        {t.comparaciones.map((c) => (
          <FilaComparacion key={c.grupo_rushers} c={c} meta={meta} />
        ))}
      </ul>

      <p className="text-base text-slate-400">
        {t.tendencia.equipo.n === 0
          ? 'Tendencia: este equipo no tiene jugadas en esta situación.'
          : `Tendencia: ${t.tendencia.etiqueta.toLowerCase()} en ${tasaConIntervalo(t.tendencia.equipo)} de sus pases; al resto, en ${tasaConIntervalo(t.tendencia.resto_liga)}.`}
      </p>
    </article>
  )
}
