import { useState } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'
import type { Hallazgo as HallazgoDatos, Meta, Reporte, Tarjeta } from './api'
import { colorEquipo, contorno, textoSobre } from './colores'
import { miles } from './formato'
import { usarDatos } from './usarDatos'
import type { Estado } from './usarDatos'
import { Cargando, ErrorCarga } from './componentes/Estados'
import CallSheet from './componentes/CallSheet'
import Exploratorio from './componentes/Exploratorio'
import GraficaVentaja from './componentes/GraficaVentaja'
import Hallazgo from './componentes/Hallazgo'
import SelectorSituacion from './componentes/SelectorSituacion'
import TarjetaSituacion from './componentes/TarjetaSituacion'

function Seccion({ titulo, children, clase = '' }: { titulo: string; children: ReactNode; clase?: string }) {
  return (
    <section className={`space-y-5 border-t border-slate-700/70 pt-8 ${clase}`}>
      <h2 className="text-xl font-extrabold uppercase tracking-[0.15em] text-slate-100">{titulo}</h2>
      {children}
    </section>
  )
}

function ReporteEquipo({ reporte, meta, situaciones }: {
  reporte: Reporte
  meta: Meta
  situaciones: Estado<Tarjeta[]>
}) {
  if (reporte.tarjetas.length === 0) {
    return <Exploratorio reporte={reporte} meta={meta} situaciones={situaciones} />
  }
  const { revisadas, con_ventaja } = reporte.revision_equipo
  return (
    <div className="space-y-4">
      <p className="text-lg text-slate-300">
        {con_ventaja} de {revisadas} situaciones revisadas de {reporte.equipo_nombre} tienen ventaja clara. En toda la
        liga: {reporte.revision_liga.con_ventaja} de {reporte.revision_liga.revisadas}.{' '}
        <span className="text-slate-400">{meta.definiciones.ventaja_clara}</span>
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        {reporte.tarjetas.map((t) => (
          <TarjetaSituacion
            key={`${t.situacion.down}-${t.situacion.distancia}`}
            t={t}
            meta={meta}
            color={colorEquipo(meta, reporte.equipo)}
          />
        ))}
      </div>
    </div>
  )
}

function Vista({ meta, hallazgo }: { meta: Meta; hallazgo: HallazgoDatos }) {
  const [equipo, setEquipo] = useState(hallazgo.situacion?.equipo ?? meta.equipos[0]?.valor ?? '')
  const [down, setDown] = useState(hallazgo.situacion?.down ?? meta.downs[0]?.valor ?? '')
  const [distancia, setDistancia] = useState(hallazgo.situacion?.distancia ?? meta.distancias[0]?.valor ?? '')

  const reporte = usarDatos<Reporte>(equipo ? () => api.reporte(equipo) : null, [equipo])
  const tarjeta = usarDatos<Tarjeta>(equipo ? () => api.situacion(equipo, down, distancia) : null, [equipo, down, distancia])
  // Las 9 situaciones del equipo (3 downs x 3 distancias): las usan la call sheet y la vista exploratoria
  const situaciones = usarDatos<Tarjeta[]>(
    equipo
      ? () => Promise.all(meta.downs.flatMap((d) => meta.distancias.map((x) => api.situacion(equipo, d.valor, x.valor))))
      : null,
    [equipo],
  )
  const cob = meta.cobertura
  const color = colorEquipo(meta, equipo)

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      {/* Barra tipo marcador */}
      <header className="grid grid-cols-1 items-center gap-4 rounded-lg border border-slate-700 bg-[#0f1a2e] px-5 py-3 md:grid-cols-3">
        <p className="text-base font-extrabold uppercase tracking-[0.2em] text-slate-100">Playbook de situación</p>
        <div className="flex items-center gap-3 md:justify-center">
          <span
            className="min-w-[4.5rem] rounded-md px-3 py-1 text-center text-2xl font-black tracking-wider tabular-nums"
            style={{ background: color, color: textoSobre(color), border: `2px solid ${contorno(color)}` }}
          >
            {equipo}
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Ataque rival</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 md:justify-end">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            {cob.temporadas.join(', ')} · Semanas {cob.semana_min}-{cob.semana_max}
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border-2 border-sky-400 px-4 py-2 text-base font-bold uppercase tracking-wider text-sky-300 hover:bg-sky-400 hover:text-slate-950"
          >
            Imprimir call sheet
          </button>
        </div>
      </header>

      <Hallazgo h={hallazgo} meta={meta} />

      {hallazgo.grafica && (
        <GraficaVentaja g={hallazgo.grafica} color={colorEquipo(meta, hallazgo.situacion?.equipo)} />
      )}

      <Seccion titulo="Situaciones con ventaja clara del equipo">
        <label className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Ataque rival</span>
          <select
            value={equipo}
            onChange={(e) => setEquipo(e.target.value)}
            className="rounded-md border border-slate-600 bg-[#0f1a2e] px-4 py-2 text-lg font-semibold text-slate-100"
          >
            {meta.equipos.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        {reporte.tipo === 'cargando' && <Cargando texto="Cargando situaciones del equipo…" />}
        {reporte.tipo === 'error' && <ErrorCarga mensaje={reporte.mensaje} />}
        {reporte.tipo === 'listo' && <ReporteEquipo reporte={reporte.datos} meta={meta} situaciones={situaciones} />}
      </Seccion>

      <Seccion titulo="Consultar una situación">
        <SelectorSituacion
          downs={meta.downs}
          distancias={meta.distancias}
          down={down}
          distancia={distancia}
          alCambiarDown={setDown}
          alCambiarDistancia={setDistancia}
        />
        {tarjeta.tipo === 'cargando' && <Cargando texto="Cargando la situación…" />}
        {tarjeta.tipo === 'error' && <ErrorCarga mensaje={tarjeta.mensaje} />}
        {tarjeta.tipo === 'listo' && <TarjetaSituacion t={tarjeta.datos} meta={meta} color={color} />}
      </Seccion>

      {/* Vista previa de la hoja impresa. Al imprimir, es lo único que queda (imprimir.css) */}
      <Seccion titulo="Call sheet" clase="contenedor-call-sheet">
        <CallSheet meta={meta} hallazgo={hallazgo} equipo={equipo} tarjetas={situaciones} />
      </Seccion>

      <footer className="space-y-1 border-t border-slate-700/70 pt-6 text-base text-slate-400">
        <p>
          Datos: temporada {cob.temporadas.join(', ')}, semanas {cob.semana_min} a {cob.semana_max}, {miles(cob.partidos)}{' '}
          partidos, {miles(cob.jugadas)} jugadas de pase.
        </p>
        {/* Las definiciones se muestran tal cual llegan de la API, sin cambiar mayúsculas (QB, PFF) */}
        <p>Presión: {meta.definiciones.presion}</p>
        <p>Blitz: {meta.definiciones.blitz}</p>
        <p>Referencia: {meta.definiciones.referencia} Intervalos de Wilson al 95%.</p>
      </footer>
    </main>
  )
}

export default function App() {
  const meta = usarDatos<Meta>(api.meta, [])
  const hallazgo = usarDatos<HallazgoDatos>(api.hallazgo, [])

  if (meta.tipo === 'error') return <Pantalla><ErrorCarga mensaje={meta.mensaje} /></Pantalla>
  if (hallazgo.tipo === 'error') return <Pantalla><ErrorCarga mensaje={hallazgo.mensaje} /></Pantalla>
  if (meta.tipo === 'cargando' || hallazgo.tipo === 'cargando') {
    return <Pantalla><Cargando texto="Cargando el hallazgo…" /></Pantalla>
  }
  return <Vista meta={meta.datos} hallazgo={hallazgo.datos} />
}

function Pantalla({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
}
