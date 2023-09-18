import { defineConfig } from 'cypress'

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  e2e: {
    'baseUrl': 'http://localhost:4200',
    supportFile: false,
    specPattern: [
      './e2e/**/*.e2e-*.ts'
    ],
    setupNodeEvents(on) {
      require('cypress-mochawesome-reporter/plugin')(on);
    },
  },

  viewportWidth: 1600,
  viewportHeight: 900,
  defaultCommandTimeout: 11000,
})