export function Cargando({ texto }: { texto: string }) {
  return <p className="text-slate-400 animate-pulse">{texto}</p>
}

export function ErrorCarga({ mensaje }: { mensaje: string }) {
  return (
    <p role="alert" className="rounded-lg border border-rose-500/50 bg-rose-950/40 p-4 text-rose-200">
      No se pudieron cargar los datos: {mensaje}
    </p>
  )
}
