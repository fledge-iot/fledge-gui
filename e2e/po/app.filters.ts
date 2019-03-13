import { browser, by, element, ExpectedConditions, promise } from 'protractor';

export class Filters {
  DETERMINISTIC_WAIT = 3000; // in milliseconds
  RETRY_ATTEMPTS = 5;
  addFilterRetryAttempts = 5;
  EC = browser.ExpectedConditions;

  /**
   * open filter wizard
   */
  openFilterWizard() {
    browser.ignoreSynchronization = true;
    return element(by.css('.add-application a')).click();
  }

  /**
   * Add a filter in south service pipeline
   * @prerequisite A south service should be added in the FogLAMP.
   * A filter should be installed and discoverable at FogLAMP side.
   * @param filterName {string} filter name
   * @param {string}   filter plugin name
   */
  addFilter(filterName: string) {
    browser.ignoreSynchronization = true;
    this.waitForFilterPluginsToLoad(this.DETERMINISTIC_WAIT).then(() => {
      browser.ignoreSynchronization = true;
      element(by.name('type')).all(by.tagName('option'))
        .then(options => {
          options[0].click();  // select first plugin in select box
        });
      // supply filter name
      element(by.id('name')).sendKeys(filterName);
      // click next button twice
      element(by.id('next')).click();
      element(by.id('next')).click();
    })
      .catch((error) => {
        if (this.addFilterRetryAttempts > 0) {
          console.log('Retrying load filter plugin.');
          this.addFilter(filterName);
        } else {
          console.log('Rejecting the promise after ' + this.RETRY_ATTEMPTS + ' attempts.');
          return Promise.reject(error);
        }
      });
    this.addFilterRetryAttempts--;
  }

  /**
   * Wait for filter plugin visibility
   * @param timeOut wait time
   */
  waitForFilterPluginsToLoad(timeOut?: number): promise.Promise<{}> {
    const isDataVisible = ExpectedConditions.visibilityOf(element(by.name('type')).element(by.tagName('option')));
    return browser.wait(ExpectedConditions.and(isDataVisible), timeOut);
  }

  /**
   *  Get filter name
   */
  getAddedFilterName() {
    browser.ignoreSynchronization = true;
    browser.wait(this.EC.visibilityOf(element(by.css('.accordion.card.cdk-drag'))), this.DETERMINISTIC_WAIT);
    return element(by.css('.accordion.card.cdk-drag')).getText();
  }
}
