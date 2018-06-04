// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './e2e/**/*.e2e-*.ts'
  ],
  capabilities: {
    'browserName': 'chrome'
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function () { }
  },
  onPrepare() {
    var HtmlReporter = require('protractor-beautiful-reporter');
    // Add a screenshot reporter and store screenshots to `/tmp`:
      jasmine.getEnv().addReporter(new HtmlReporter({
         baseDirectory: 'tmp',
         jsonsSubfolder: 'json',
         screenshotsSubfolder: 'screenshots',
         takeScreenShotsOnlyForFailedSpecs: true,
         preserveDirectory: false
      }).getJasmine2Reporter());

    require('ts-node').register({
      project: 'e2e/tsconfig.e2e.json'
    });
    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
  }
};
