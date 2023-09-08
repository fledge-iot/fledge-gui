import { defineConfig } from 'cypress'

export default defineConfig({
  
  e2e: {
    'baseUrl': 'http://localhost:4200',
    supportFile: false,
    specPattern: [
      './e2e/**/*.e2e-*.ts'
    ]
  },
  

  defaultCommandTimeout: 11000,
  // suites: {
  //   common: './e2e/specs/**/*.e2e-common.ts',
  //   south: './e2e/specs/**/*.e2e-south.ts',
  // },
  // capabilities: {
  //   'browserName': 'chrome'
  // },
  // directConnect: true,
  // framework: 'jasmine',
  // jasmineNodeOpts: {
  //   showColors: true,
  //   defaultTimeoutInterval: 30000,
  //   print: function () { }
  // },
  // onPrepare() {
  //   var HtmlReporter = require('protractor-beautiful-reporter');
  //   // Add a screenshot reporter and store screenshots to `/e2e-test-report`:
  //     jasmine.getEnv().addReporter(new HtmlReporter({
  //        baseDirectory: 'e2e-test-report',
  //        jsonsSubfolder: 'json',
  //        screenshotsSubfolder: 'screenshots',
  //        takeScreenShotsOnlyForFailedSpecs: true,
  //        preserveDirectory: false
  //     }).getJasmine2Reporter());

  //   require('ts-node').register({
  //     project: 'e2e/tsconfig.e2e.json'
  //   });
  //   jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
  // }
  
  
})