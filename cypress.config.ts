import { defineConfig } from 'cypress'

export default defineConfig({

  e2e: {
    'baseUrl': 'http://localhost:4200',
    supportFile: false,
    specPattern: [
      './e2e/**/*.e2e-*.ts'
    ]
  },

  viewportWidth: 1600,
  viewportHeight: 900,
  defaultCommandTimeout: 11000,
})