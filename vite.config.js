import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['api.umiai.ru', '365b-188-163-49-245.ngrok-free.app'] 
  }
})