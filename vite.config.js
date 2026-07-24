import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// การตั้งค่า Vite
// base ต้องตรงกับชื่อ repo บน GitHub Pages -> https://sirapobsak.github.io/library-booking/
export default defineConfig({
  base: '/library-booking/',
  plugins: [react()],
})
