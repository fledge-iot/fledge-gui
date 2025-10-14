import { defineConfig } from 'cypress'

export default defineConfig({
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  e2e: {
    'baseUrl': 'http://localhost:4200',
    supportFile: false,
    specPattern: [
      './e2e/**/*.e2e-*.ts'
    ],
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      
      // Add Chrome flags for CI environments
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-software-rasterizer');
        }
        return launchOptions;
      });
      
      return config;
    },
  },

  viewportWidth: 1600,
  viewportHeight: 900,
  defaultCommandTimeout: 11000,
})