import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' para que el build funcione desde cualquier ruta.
// En desarrollo, /api va a Uvicorn (python -m uvicorn backend.main:app --reload).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
