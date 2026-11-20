import type { Evidencia, Intervalo, Tasa } from './api'

export function pct(x: number | null, decimales = 1): string {
  return x === null ? 's/d' : `${(x * 100).toFixed(decimales)}%`
}

export function rango(ic: Intervalo | null): string {
  return ic === null ? 'sin intervalo' : `${(ic[0] * 100).toFixed(1)}-${(ic[1] * 100).toFixed(1)}%`
}

export function miles(n: number): string {
  return n.toLocaleString('es-MX')
}

// "59.0% (IC 95%: 43.4-72.9%, n = 39)"
export function tasaConIntervalo(t: Tasa): string {
  if (t.n === 0) return 'sin jugadas'
  return `${pct(t.tasa)} (IC 95%: ${rango(t.ic95)}, n = ${miles(t.n)})`
}

export const NOMBRE_EVIDENCIA: Record<Evidencia, string> = {
  insuficiente: 'Muestra insuficiente',
  sin_diferencia: 'Sin diferencia clara',
  indicio: 'Indicio',
  solida: 'Evidencia sólida',
}
