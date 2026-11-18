import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: supabaseUrl
      ? {
          proxy: {
            '/sb': {
              target: supabaseUrl,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/sb/, ''),
            },
          },
        }
      : undefined,
  }
})
