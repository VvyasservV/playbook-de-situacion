import type { Grafica, Meta, Reporte, Tarjeta } from '../api'
import type { Estado } from '../usarDatos'
import { Cargando, ErrorCarga } from './Estados'
import GraficaVentaja from './GraficaVentaja'
import TarjetaSituacion from './TarjetaSituacion'

const TITULO_GRAFICA = 'Con tan pocas jugadas los rangos son muy amplios y se cruzan con la liga'

// Una fila por situación con al menos 1 jugada del primer grupo de rushers (4 o menos), de mayor a menor n.
function GraficaExploratoria({ tarjetas, meta }: { tarjetas: Tarjeta[]; meta: Meta }) {
  const grupo = meta.grupos_rushers[0]?.valor
  const filas = tarjetas
    .map((t) => ({ t, c: t.comparaciones.find((x) => x.grupo_rushers === grupo) }))
    .filter(({ c }) => c !== undefined && c.equipo.n >= 1)
    .sort((a, b) => b.c!.equipo.n - a.c!.equipo.n)
  if (filas.length === 0) return null
  const g: Grafica = {
    titulo: TITULO_GRAFICA,
    eje: 'Tasa de presión permitida con 4 rushers o menos (%)',
    filas: filas.map(({ t, c }) => ({ etiqueta: t.situacion_corta, tasa: c!.equipo.tasa, ic95: c!.equipo.ic95, n: c!.equipo.n })),
    hueco: null,
  }
  return <GraficaVentaja g={g} color="#94a3b8" bandasLiga={filas.map(({ c }) => c!.resto_liga.ic95)} />
}

// Equipo sin ventaja clara: aviso ámbar y sus situaciones con al menos 1 jugada, solo como referencia.
export default function Exploratorio({ reporte, meta, situaciones }: {
  reporte: Reporte
  meta: Meta
  situaciones: Estado<Tarjeta[]>
}) {
  const semanas = meta.cobertura.semana_max - meta.cobertura.semana_min + 1
  const liga = reporte.revision_liga
  return (
    <div className="space-y-5">
      <div role="note" className="rounded-md border-2 border-amber-400 bg-amber-950/40 p-4">
        <p className="text-lg font-bold text-amber-100">
          Datos exploratorios: {reporte.equipo_nombre} no tiene situaciones con ventaja clara. Estas cifras tienen muy
          pocas jugadas y no sirven para decidir; las mostramos solo como referencia.
        </p>
        <p className="mt-1 text-base text-amber-200/90">
          Con {semanas} semanas de datos, solo {liga.con_ventaja} de {liga.revisadas} situaciones de toda la liga tienen
          ventaja clara.
        </p>
      </div>

      {situaciones.tipo === 'cargando' && <Cargando texto="Cargando situaciones del equipo…" />}
      {situaciones.tipo === 'error' && <ErrorCarga mensaje={situaciones.mensaje} />}
      {situaciones.tipo === 'listo' && <GraficaExploratoria tarjetas={situaciones.datos} meta={meta} />}

      {situaciones.tipo === 'listo' && (
        <div className="grid gap-5 lg:grid-cols-2">
          {situaciones.datos
            .filter((t) => t.n >= 1)
            .sort((a, b) => b.n - a.n)
            .map((t) => (
              <TarjetaSituacion
                key={`${t.situacion.down}-${t.situacion.distancia}`}
                t={t}
                meta={meta}
                color={null}
              />
            ))}
        </div>
      )}
    </div>
  )
}
