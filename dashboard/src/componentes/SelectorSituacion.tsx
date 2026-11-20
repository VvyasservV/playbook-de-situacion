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
              className={`rounded-lg border-2 px-5 py-3 text-lg transition-colors ${
                activo
                  ? 'border-sky-300 bg-sky-400 font-bold text-slate-950 shadow-lg shadow-sky-500/30'
                  : 'border-slate-600 bg-slate-800 font-normal text-slate-100 hover:border-sky-400'
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
