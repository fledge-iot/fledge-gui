import { browser, by, element, ExpectedConditions, promise } from 'protractor';

export class SouthPage {
  DETERMINISTIC_WAIT = 3000; // in milliseconds
  RETRY_ATTEMPTS = 5;
  addServiceRetryAttempts = 5;
  fetchAssetRetryAttempts = 5;
  EC = browser.ExpectedConditions;

  /**
   *  Navigate to the south service page
   */
  navToSouthPage() {
    return browser.get('/#/south');
  }

  /**
   *  get south page title
   */
  getSouthPageTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('#south-service .title')).getText();
  }

  /**
   *  open south service add wizard
   */
  clickAddServiceButton() {
    browser.ignoreSynchronization = true;
    return element(by.id('add_south_service')).click();
  }

  /**
   * To add south service
   * @prerequisite south service plugin should be pre-installed and discoverable at
   * FogLAMP side.
   * @param serviceName {string} south service name
   * @param {string}    south plugin name
   */
  addSouthService(serviceName: string) {
    browser.ignoreSynchronization = true;
    this.waitForServicePluginsToLoad(this.DETERMINISTIC_WAIT).then(() => {
      // select a plugin
      element(by.name('type')).all(by.tagName('option'))
        .then(options => {
          options[0].click();  // select first plugin in select box
        });
      // supply service name
      element(by.id('name')).sendKeys(serviceName);
      // click next button thrice
      element(by.id('next')).click();
      element(by.id('next')).click();
      element(by.id('next')).click();
    })
      .catch((error) => {
        if (this.addServiceRetryAttempts > 0) {
          console.log('Retrying load service.');
          this.addSouthService(serviceName);
        } else {
          console.log('Rejecting the promise after ' + this.RETRY_ATTEMPTS + ' attempts.');
          return Promise.reject(error);
        }
      });
    this.addServiceRetryAttempts--;
  }

  /**
   * Wait for visibility of south service plugin in multi drop-down
   * @param timeOut wait time
   */
  waitForServicePluginsToLoad(timeOut?: number): promise.Promise<{}> {
    const isDataVisible = ExpectedConditions.visibilityOf(element(by.name('type')).element(by.tagName('option')));
    return browser.wait(ExpectedConditions.and(isDataVisible), timeOut);
  }

  /**
   *  Get added south service name
   */
  getServiceName() {
    browser.ignoreSynchronization = true;
    browser.wait(this.EC.visibilityOf(element(by.css('#south-service-list tr:nth-child(1) .button'))), this.DETERMINISTIC_WAIT);
    return element(by.css('#south-service-list tr:nth-child(1) .button')).getText();
  }

  /**
   *  open south service modal
   */
  openSouthServiceModal() {
    browser.ignoreSynchronization = true;
    browser.wait(this.EC.visibilityOf(element(by.css('.content table tr:nth-child(1) .button'))), this.DETERMINISTIC_WAIT);
    return element(by.css('.content table tr:nth-child(1) .button')).click();
  }

  /**
   *  get enabled south service asset readings count
   */
  getAssetCount() {
    browser.ignoreSynchronization = true;
    this.waitForAssetReadingsToLoad(this.DETERMINISTIC_WAIT).then((found) => {
      return Promise.resolve(found);
    })
      .catch((error) => {
        if (this.fetchAssetRetryAttempts > 0) {
          console.log('Retrying to load asset readings.');
          this.getAssetCount();
        } else {
          console.log('Rejecting the promise after ' + this.RETRY_ATTEMPTS + ' attempts.');
          return Promise.reject(error);
        }
      });
    this.fetchAssetRetryAttempts--;
    return element(by.css('#south-service-list tr:nth-child(1) td:nth-child(3) table tr:nth-child(1) td:nth-child(2) small'))
      .getText();
  }

  /**
   * Wait for asset readings count to get visible
   * @param timeOut   wait time
   */
  waitForAssetReadingsToLoad(timeOut?: number): promise.Promise<{}> {
    const isDataVisible = ExpectedConditions.visibilityOf(element
      (by.css('#south-service-list tr:nth-child(1) td:nth-child(3) table tr:nth-child(1) td:nth-child(2) small')));
    return browser.wait(ExpectedConditions.and(isDataVisible), timeOut);
  }

  /**
   * close south service modal window
   */
  closeSouthServiceModal() {
    element(by.css('#south-service-modal .delete')).click();
  }
}
