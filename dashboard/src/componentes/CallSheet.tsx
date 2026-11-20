import { api } from '../api'
import type { Hallazgo, Meta, Tarjeta } from '../api'
import { miles, pct } from '../formato'
import { usarDatos } from '../usarDatos'
import { Cargando, ErrorCarga } from './Estados'

const NIVEL: Record<string, string> = { indicio: 'indicio', solida: 'sólida' }

function jugadas(n: number): string {
  return `${miles(n)} ${n === 1 ? 'jugada' : 'jugadas'}`
}

// El mínimo de 30 jugadas se aplica por grupo de rushers: la caja muestra la n del grupo principal.
function Caja({ t, grupo }: { t: Tarjeta; grupo: { valor: string; etiqueta: string } }) {
  const clave = t.comparaciones.find((c) => c.direccion !== null)
  if (t.recomendacion_corta && clave) {
    return (
      <div className="cs-caja cs-caja-recomienda">
        <div className="cs-caja-encabezado">{t.situacion_corta}</div>
        <div className="cs-caja-cuerpo">
          <p className="cs-orden">{t.recomendacion_corta}</p>
          <p className="cs-cifra">
            {pct(clave.equipo.tasa, 0)} vs {pct(clave.resto_liga.tasa, 0)} liga
          </p>
          <p className="cs-n">
            n = {miles(clave.equipo.n)} · {NIVEL[clave.evidencia] ?? clave.evidencia}
          </p>
        </div>
      </div>
    )
  }
  const insuficiente = t.comparaciones.every((c) => c.evidencia === 'insuficiente')
  const n = t.comparaciones.find((c) => c.grupo_rushers === grupo.valor)?.equipo.n ?? 0
  return (
    <div className="cs-caja">
      <div className="cs-caja-encabezado">{t.situacion_corta}</div>
      <div className="cs-caja-cuerpo cs-gris">
        <p className="cs-estado">{insuficiente ? 'Muestra insuficiente' : 'Sin diferencia'}</p>
        <p className="cs-n">
          n = {jugadas(n)} con {grupo.etiqueta.toLowerCase()}
        </p>
      </div>
    </div>
  )
}

// La hoja que se imprime: 3 downs x 3 distancias del equipo elegido (9 llamadas a api/situacion).
export default function CallSheet({ meta, hallazgo, equipo }: { meta: Meta; hallazgo: Hallazgo; equipo: string }) {
  const tarjetas = usarDatos<Tarjeta[]>(
    () => Promise.all(meta.downs.flatMap((d) => meta.distancias.map((x) => api.situacion(equipo, d.valor, x.valor)))),
    [equipo],
  )
  const nombre = meta.equipos.find((e) => e.valor === equipo)?.nombre ?? equipo

  return (
    <div className="call-sheet">
      <header className="cs-franja">
        <p className="cs-titulo">Call sheet de presión · Ataque rival: {nombre}</p>
        <p className="cs-linea">{hallazgo.frase}</p>
        {hallazgo.decision && <p className="cs-linea">Decisión: {hallazgo.decision}</p>}
      </header>

      {tarjetas.tipo === 'cargando' && <Cargando texto="Cargando la call sheet…" />}
      {tarjetas.tipo === 'error' && <ErrorCarga mensaje={tarjetas.mensaje} />}
      {tarjetas.tipo === 'listo' && (
        <div className="cs-cuadricula" style={{ gridTemplateColumns: `repeat(${meta.distancias.length}, 1fr)` }}>
          {tarjetas.datos.map((t) => (
            <Caja key={`${t.situacion.down}-${t.situacion.distancia}`} t={t} grupo={meta.grupos_rushers[0]} />
          ))}
        </div>
      )}

      <footer className="cs-pie">
        <p>Presión: {meta.definiciones.presion}</p>
        <p>Blitz: {meta.definiciones.blitz}</p>
        <p>
          Referencia: {meta.definiciones.referencia} {meta.definiciones.ventaja_clara} Recomendamos solo con{' '}
          {meta.umbrales.n_minimo} jugadas o más.
        </p>
      </footer>
    </div>
  )
}
