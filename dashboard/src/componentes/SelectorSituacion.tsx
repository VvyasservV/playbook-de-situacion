import type { Opcion } from '../api'

interface Props {
  downs: Opcion[]
  distancias: Opcion[]
  down: string
  distancia: string
  alCambiarDown: (valor: string) => void
  alCambiarDistancia: (valor: string) => void
}

function GrupoBotones({ titulo, opciones, valor, alCambiar }: {
  titulo: string
  opciones: Opcion[]
  valor: string
  alCambiar: (valor: string) => void
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-base text-slate-400">{titulo}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => {
          const activo = o.valor === valor
          return (
            <button
              key={o.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => alCambiar(o.valor)}
              className={`rounded-lg border px-5 py-3 text-lg font-semibold transition-colors ${
                activo ? 'border-sky-400 bg-sky-400 text-slate-950' : 'border-slate-600 text-slate-200 hover:border-sky-400'
              }`}
            >
              {o.etiqueta}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function SelectorSituacion(p: Props) {
  return (
    <div className="flex flex-wrap gap-6">
      <GrupoBotones titulo="Down" opciones={p.downs} valor={p.down} alCambiar={p.alCambiarDown} />
      <GrupoBotones titulo="Distancia por avanzar" opciones={p.distancias} valor={p.distancia} alCambiar={p.alCambiarDistancia} />
    </div>
  )
}
