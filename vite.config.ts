import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Keep the junction path stable (avoids resolving back to the spaced real path
  // when served via the C:\cairn-dev junction during local preview).
  resolve: { preserveSymlinks: true },
})
