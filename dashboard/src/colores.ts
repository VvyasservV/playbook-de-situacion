import type { Meta } from './api'

export const ACENTO = '#38bdf8' // sky-400, si el equipo no tiene color
export const BORDE_CLARO = '#e2e8f0'

export function colorEquipo(meta: Meta, equipo: string | undefined): string {
  return meta.equipos.find((e) => e.valor === equipo)?.color ?? ACENTO
}

// Luminancia relativa (WCAG). Por debajo de 0.08 el color se pierde sobre el fondo carbón.
export function esOscuro(hex: string): boolean {
  const canal = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5) < 0.08
}

// Texto legible sobre el color del equipo (oro de NO, amarillo de PIT, naranja de CIN...)
export function textoSobre(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#0b1220' : '#ffffff'
}

// Contorno claro para colores oscuros: el color del equipo se sigue viendo sobre el fondo.
export function contorno(hex: string): string {
  return esOscuro(hex) ? BORDE_CLARO : hex
}
