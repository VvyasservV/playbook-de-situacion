import {
  Bar,
  Cell,
  ComposedChart,
  LabelList,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import type { Grafica, Intervalo } from '../api'
import { ACENTO, BORDE_CLARO, esOscuro } from '../colores'
import { miles, pct } from '../formato'

const COLOR_LIGA = '#64748b' // slate-500
const COLOR_TEXTO = '#e2e8f0'
const COLOR_GRIS = '#94a3b8' // slate-400
const ANCHO_BANDA = 34
const ANCHO_BARRA_EXPLORATORIA = 12

interface Fila {
  etiqueta: string
  rango: [number, number]
  banda: [number, number] | null
  tasa: number
  texto: string
}

// Intervalo del equipo contra intervalo del resto de la liga, con el hueco entre los dos sombreado.
// `color` es el del equipo del hallazgo; si es oscuro, la barra lleva contorno claro.
// Con `bandasLiga` (una por fila) es la versión exploratoria: todo en gris, sin hueco, y detrás de cada
// fila una franja con el intervalo del resto de la liga en esa situación.
export default function GraficaVentaja({ g, color, bandasLiga }: {
  g: Grafica
  color: string
  bandasLiga?: (Intervalo | null)[]
}) {
  const exploratoria = bandasLiga !== undefined
  const filas: Fila[] = g.filas
    .map((f, i) => ({ f, banda: bandasLiga?.[i] ?? null }))
    .filter(({ f }) => f.ic95 !== null && f.tasa !== null)
    .map(({ f, banda }) => ({
      etiqueta: f.etiqueta,
      rango: [f.ic95![0] * 100, f.ic95![1] * 100],
      banda: banda ? [banda[0] * 100, banda[1] * 100] : null,
      tasa: f.tasa! * 100,
      texto: exploratoria ? `n = ${miles(f.n)}` : `${pct(f.tasa)} · n = ${miles(f.n)}`,
    }))
  const liga = filas[filas.length - 1]
  const alto = exploratoria ? filas.length * 46 + 70 : 256

  return (
    <figure className="space-y-3">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
        {exploratoria ? 'Datos exploratorios' : 'Gráfica de firma'}
      </p>
      <figcaption className="text-2xl font-bold">{g.titulo}</figcaption>
      <div className="w-full" style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filas}
            layout="vertical"
            margin={{ top: 10, right: 130, bottom: 30, left: 10 }}
            // En la versión exploratoria la barra del equipo queda centrada sobre la franja de la liga
            barGap={exploratoria ? (ANCHO_BANDA - ANCHO_BARRA_EXPLORATORIA) / 2 - ANCHO_BANDA : undefined}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              unit="%"
              tick={{ fill: COLOR_TEXTO, fontSize: 16 }}
              label={{ value: g.eje, position: 'insideBottom', offset: -20, fill: COLOR_TEXTO, fontSize: 16 }}
            />
            <YAxis
              type="category"
              dataKey="etiqueta"
              width={exploratoria ? 170 : 220}
              tick={{ fill: COLOR_TEXTO, fontSize: 16 }}
            />
            {!exploratoria && g.hueco && (
              <ReferenceArea
                x1={g.hueco[0] * 100}
                x2={g.hueco[1] * 100}
                fill={ACENTO}
                fillOpacity={0.15}
                stroke={ACENTO}
                strokeDasharray="4 4"
                label={{ value: 'Hueco', position: 'insideTop', fill: '#7dd3fc', fontSize: 16 }}
              />
            )}
            {!exploratoria && liga && <ReferenceLine x={liga.tasa} stroke={COLOR_LIGA} strokeDasharray="6 4" />}
            {exploratoria && (
              <Bar dataKey="banda" barSize={ANCHO_BANDA} fill={COLOR_LIGA} fillOpacity={0.35} isAnimationActive={false} />
            )}
            <Bar dataKey="rango" barSize={exploratoria ? ANCHO_BARRA_EXPLORATORIA : 28} isAnimationActive={false}>
              {filas.map((f, i) => (
                <Cell
                  key={f.etiqueta}
                  fill={exploratoria ? COLOR_GRIS : i === filas.length - 1 ? COLOR_LIGA : color}
                  stroke={!exploratoria && i < filas.length - 1 && esOscuro(color) ? BORDE_CLARO : undefined}
                  strokeWidth={2}
                />
              ))}
              <LabelList dataKey="texto" position="right" fill={COLOR_TEXTO} fontSize={16} />
            </Bar>
            {filas.map((f) => (
              <ReferenceDot
                key={f.etiqueta}
                x={f.tasa}
                y={f.etiqueta}
                r={exploratoria ? 6 : 7}
                fill={exploratoria ? COLOR_GRIS : '#0f172a'}
                stroke={COLOR_TEXTO}
                strokeWidth={2}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-base text-slate-400">
        {exploratoria
          ? 'La barra gris es el intervalo de confianza al 95% del equipo con 4 rushers o menos y el punto es su tasa. La franja de fondo es el intervalo del resto de la liga en la misma situación.'
          : 'Cada barra es el intervalo de confianza al 95% y el punto es la tasa observada. La línea punteada marca al resto de la liga. La zona sombreada es el hueco entre los dos rangos: no se tocan.'}
      </p>
    </figure>
  )
}
