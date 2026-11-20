import { useEffect, useState } from 'react'

export type Estado<T> =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; datos: T }

// Pide datos cuando cambian las dependencias. Ignora respuestas viejas si el usuario cambió de selección.
export function usarDatos<T>(pedir: (() => Promise<T>) | null, dependencias: unknown[]): Estado<T> {
  const [estado, setEstado] = useState<Estado<T>>({ tipo: 'cargando' })

  useEffect(() => {
    if (pedir === null) return
    let vigente = true
    setEstado({ tipo: 'cargando' })
    pedir()
      .then((datos) => vigente && setEstado({ tipo: 'listo', datos }))
      .catch((e: unknown) =>
        vigente && setEstado({ tipo: 'error', mensaje: e instanceof Error ? e.message : 'Error desconocido' }),
      )
    return () => {
      vigente = false
    }
  }, dependencias)

  return estado
}
