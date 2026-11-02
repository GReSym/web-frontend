import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Общие настройки прокси и хостов для обоих режимов
  const sharedServerConfig = {
    // Разрешаем принимать запросы со случайных поддоменов туннелей (ngrok, localtunnel и др.)
    allowedHosts: true,

    // Проксирование API
    proxy: {
      '/api': {
        target: env.VITE_API_PROXY_TARGET || 'http://localhost:5147',
        changeOrigin: true,
      },
    },
  }

  return {
    plugins: [vue(), vueJsx(), vueDevTools()],
                            resolve: {
                              alias: {
                                '@': fileURLToPath(new URL('./src', import.meta.url)),
                              },
                            },
                            // Настройки для npm run dev
                            server: sharedServerConfig,

                            // Настройки для npm run preview (теперь прокси и ngrok заработают здесь)
                            preview: sharedServerConfig,
  }
})
