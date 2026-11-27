import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { localBridgePlugin } from './vite-plugin-local-bridge'

export default defineConfig(({ mode }) => {
  // Carrega somente variáveis VITE_ do .env conforme o modo
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Restrict demo bundles to the authorized PR and strip VITE_* values from them.
  const publicDemo = (process.env.CONTEXT === 'deploy-preview' && process.env.REVIEW_ID === '6') || process.env.SAGB_DEMO_BUILD === 'true'
  const productionIAM = process.env.CONTEXT === 'production' && process.env.VITE_SAGB_IAM_PILOT === 'true'
  const envPortRaw = process.env.PORT || env.VITE_DEV_SERVER_PORT
  const resolvedPort = Number(envPortRaw || 7000)

  // Base padrão para deploy no domínio raiz
  // Se você quiser subpasta, defina VITE_BASE_PATH="/sua-subpasta/"
  const basePath = env.VITE_BASE_PATH && env.VITE_BASE_PATH.trim() ? env.VITE_BASE_PATH : '/'
  const aiProxyTarget = env.VITE_AI_PROXY_TARGET && env.VITE_AI_PROXY_TARGET.trim()
    ? env.VITE_AI_PROXY_TARGET
    : 'https://sagb.piblo.com.br'

  return {
    base: basePath,
    ...(publicDemo ? { envPrefix: 'SAGB_DEMO_UNUSED_', define: { 'import.meta.env.VITE_SAGB_PUBLIC_DEMO': JSON.stringify('true') } } : productionIAM ? { envPrefix: 'VITE_SAGB_IAM_' } : {}),
    plugins: [
      react(),
      // Plugin de bridge local para acesso ao filesystem Z:\
      // Ativo apenas em desenvolvimento (configureServer só roda em dev)
      ...(mode !== 'production' ? [localBridgePlugin()] : []),
    ],
    server: {
      port: Number.isFinite(resolvedPort) ? resolvedPort : 7000,
      strictPort: true,
      host: true,
      watch: {
        // Mais estável em ambiente de rede/WSL/UNC
        usePolling: true,
        interval: 1000
      },
      proxy: {
        '/api': {
          target: aiProxyTarget,
          changeOrigin: true,
          secure: true
        },
        // Proxy para webhooks financeiros (desenvolvimento)
        '/api/finance/webhook': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path // Mantém o mesmo path
        },
        // Proxy para testes de webhook
        '/api/finance/test-signature': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      // Evita falha de build quando `dist/assets` está bloqueado pelo filesystem/Windows.
      // Não altera lógica de aplicação; apenas direciona os assets gerados para pasta limpa.
      assetsDir: 'assets_build',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('react-markdown')) return 'markdown'
            if (id.includes('@google/genai')) return 'ai-sdk'
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor'
            return 'vendor'
          }
        }
      }
    },

    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    }
  }
})
