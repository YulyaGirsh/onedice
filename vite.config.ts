import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'fs'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_URL || 'https://deftly-saintly-grizzly.cloudpub.ru/'
  const keyPath = path.resolve('./localhost+2-key.pem')
  const certPath = path.resolve('./localhost+2.pem')
  const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 3000,
      // HTTPS для работы через публичный туннель; используем локальные сертификаты, если есть
      ...(hasCerts ? { https: { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) } } : {}),
      proxy: {
        '/games': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/users': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/events': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/ping': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/rating': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  }
})