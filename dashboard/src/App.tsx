import { useState } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'
import type { Hallazgo as HallazgoDatos, Meta, Reporte, Tarjeta } from './api'
import { miles } from './formato'
import { usarDatos } from './usarDatos'
import { Cargando, ErrorCarga } from './componentes/Estados'
import GraficaVentaja from './componentes/GraficaVentaja'
import Hallazgo from './componentes/Hallazgo'
import SelectorSituacion from './componentes/SelectorSituacion'
import TarjetaSituacion from './componentes/TarjetaSituacion'

const SIN_VENTAJA = 'Ninguna situación de este equipo se separa de la liga con evidencia suficiente'

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-5 border-t border-slate-800 pt-8">
      <h2 className="text-2xl font-bold">{titulo}</h2>
      {children}
    </section>
  )
}

function ReporteEquipo({ reporte, meta }: { reporte: Reporte; meta: Meta }) {
  const { revisadas, con_ventaja } = reporte.revision_equipo
  return (
    <div className="space-y-4">
      <p className="text-lg text-slate-300">
        {revisadas === 0
          ? `${reporte.equipo_nombre} no tiene situaciones con ${meta.umbrales.n_minimo} jugadas o más.`
          : `${con_ventaja} de ${revisadas} situaciones revisadas de ${reporte.equipo_nombre} tienen ventaja clara.`}{' '}
        En toda la liga: {reporte.revision_liga.con_ventaja} de {reporte.revision_liga.revisadas}.{' '}
        <span className="text-slate-400">{meta.definiciones.ventaja_clara}</span>
      </p>
      {reporte.tarjetas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-600 p-5 text-xl font-semibold text-slate-300">
          {SIN_VENTAJA}
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {reporte.tarjetas.map((t) => (
            <TarjetaSituacion key={`${t.situacion.down}-${t.situacion.distancia}`} t={t} meta={meta} />
          ))}
        </div>
      )}
    </div>
  )
}

function Vista({ meta, hallazgo }: { meta: Meta; hallazgo: HallazgoDatos }) {
  const [equipo, setEquipo] = useState(hallazgo.situacion?.equipo ?? meta.equipos[0]?.valor ?? '')
  const [down, setDown] = useState(hallazgo.situacion?.down ?? meta.downs[0]?.valor ?? '')
  const [distancia, setDistancia] = useState(hallazgo.situacion?.distancia ?? meta.distancias[0]?.valor ?? '')

  const reporte = usarDatos<Reporte>(equipo ? () => api.reporte(equipo) : null, [equipo])
  const tarjeta = usarDatos<Tarjeta>(equipo ? () => api.situacion(equipo, down, distancia) : null, [equipo, down, distancia])
  const cob = meta.cobertura
  const nombreEquipo = meta.equipos.find((e) => e.valor === equipo)?.nombre ?? equipo

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-base text-slate-400">
          Playbook de Situación · preparación del plan de presión contra el ataque rival
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-imprimir rounded-lg border-2 border-sky-400 px-5 py-2 text-lg font-bold text-sky-300 hover:bg-sky-400 hover:text-slate-950"
        >
          Imprimir call sheet
        </button>
      </header>

      <p className="solo-imprimir titulo-call-sheet">
        Call sheet de presión · Ataque rival: {nombreEquipo}
      </p>

      <Hallazgo h={hallazgo} meta={meta} />

      {hallazgo.grafica && (
        <div className="no-imprimir">
          <GraficaVentaja g={hallazgo.grafica} />
        </div>
      )}

      <Seccion titulo="Situaciones con ventaja clara del equipo">
        <label className="no-imprimir flex flex-wrap items-center gap-3 text-lg">
          <span className="text-slate-300">Ataque rival</span>
          <select
            value={equipo}
            onChange={(e) => setEquipo(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-lg text-slate-100"
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
        {reporte.tipo === 'listo' && <ReporteEquipo reporte={reporte.datos} meta={meta} />}
      </Seccion>

      <Seccion titulo="Consultar una situación">
        <div className="no-imprimir">
          <SelectorSituacion
            downs={meta.downs}
            distancias={meta.distancias}
            down={down}
            distancia={distancia}
            alCambiarDown={setDown}
            alCambiarDistancia={setDistancia}
          />
        </div>
        {tarjeta.tipo === 'cargando' && <Cargando texto="Cargando la situación…" />}
        {tarjeta.tipo === 'error' && <ErrorCarga mensaje={tarjeta.mensaje} />}
        {tarjeta.tipo === 'listo' && <TarjetaSituacion t={tarjeta.datos} meta={meta} />}
      </Seccion>

      <footer className="space-y-1 border-t border-slate-800 pt-6 text-base text-slate-400">
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
