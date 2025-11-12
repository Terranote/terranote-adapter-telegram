import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  resolve: {
    alias: {
      '@': join(__dirname, 'src')
    }
  },
  test: {
    environment: 'node',
    setupFiles: [],
    coverage: {
      enabled: false
    }
  }
})

