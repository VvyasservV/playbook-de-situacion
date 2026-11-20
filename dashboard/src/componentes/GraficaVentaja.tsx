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
import type { Grafica } from '../api'
import { miles, pct } from '../formato'

const COLOR_EQUIPO = '#38bdf8' // acento (sky-400)
const COLOR_LIGA = '#64748b' // slate-500
const COLOR_TEXTO = '#e2e8f0'

interface Fila {
  etiqueta: string
  rango: [number, number]
  tasa: number
  texto: string
}

// Intervalo del equipo contra intervalo del resto de la liga, con el hueco entre los dos sombreado.
export default function GraficaVentaja({ g }: { g: Grafica }) {
  const filas: Fila[] = g.filas
    .filter((f) => f.ic95 !== null && f.tasa !== null)
    .map((f) => ({
      etiqueta: f.etiqueta,
      rango: [f.ic95![0] * 100, f.ic95![1] * 100],
      tasa: f.tasa! * 100,
      texto: `${pct(f.tasa)} · n = ${miles(f.n)}`,
    }))
  const liga = filas[filas.length - 1]

  return (
    <figure className="space-y-3">
      <figcaption className="text-2xl font-semibold">{g.titulo}</figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filas} layout="vertical" margin={{ top: 10, right: 130, bottom: 30, left: 10 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              unit="%"
              tick={{ fill: COLOR_TEXTO, fontSize: 16 }}
              label={{ value: g.eje, position: 'insideBottom', offset: -20, fill: COLOR_TEXTO, fontSize: 16 }}
            />
            <YAxis type="category" dataKey="etiqueta" width={220} tick={{ fill: COLOR_TEXTO, fontSize: 16 }} />
            {g.hueco && (
              <ReferenceArea
                x1={g.hueco[0] * 100}
                x2={g.hueco[1] * 100}
                fill={COLOR_EQUIPO}
                fillOpacity={0.15}
                stroke={COLOR_EQUIPO}
                strokeDasharray="4 4"
                label={{ value: 'Hueco', position: 'insideTop', fill: '#7dd3fc', fontSize: 14 }}
              />
            )}
            {liga && <ReferenceLine x={liga.tasa} stroke={COLOR_LIGA} strokeDasharray="6 4" />}
            <Bar dataKey="rango" barSize={28} isAnimationActive={false}>
              {filas.map((f, i) => (
                <Cell key={f.etiqueta} fill={i === filas.length - 1 ? COLOR_LIGA : COLOR_EQUIPO} />
              ))}
              <LabelList dataKey="texto" position="right" fill={COLOR_TEXTO} fontSize={16} />
            </Bar>
            {filas.map((f) => (
              <ReferenceDot key={f.etiqueta} x={f.tasa} y={f.etiqueta} r={7} fill="#0f172a" stroke={COLOR_TEXTO} strokeWidth={2} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-base text-slate-400">
        Cada barra es el intervalo de confianza al 95% y el punto es la tasa observada. La línea punteada marca al
        resto de la liga. La zona sombreada es el hueco entre los dos rangos: no se tocan.
      </p>
    </figure>
  )
}
