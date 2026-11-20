import type { Evidencia } from '../api'
import { miles, NOMBRE_EVIDENCIA } from '../formato'

const ESTILO: Record<Evidencia, string> = {
  solida: 'border-sky-400 text-sky-200',
  indicio: 'border-sky-400/60 border-dashed text-sky-200',
  sin_diferencia: 'border-slate-500 text-slate-300',
  insuficiente: 'border-slate-600 border-dashed text-slate-400',
}

// El nivel va siempre en texto, nunca solo como color.
export default function InsigniaEvidencia({ evidencia, n }: { evidencia: Evidencia; n: number }) {
  return (
    <span className={`inline-block rounded-full border px-3 py-0.5 text-sm font-medium ${ESTILO[evidencia]}`}>
      {NOMBRE_EVIDENCIA[evidencia]} · n = {miles(n)}
    </span>
  )
}
