import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/88
export default defineConfig({
  plugins: [
    vue({
      script: {
        defineModel: true
      }
    }),
    vueJsx()
  ],
  build: {
    outDir: 'dist'
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      primevue: fileURLToPath(new URL('./node_modules/primevue', import.meta.url))
    }
  }
})
