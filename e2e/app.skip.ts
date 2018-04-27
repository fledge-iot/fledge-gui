import { browser, by, element } from 'protractor';

export class SkipLogin {
  navigateToHome() {
    return browser.get('/');
  }

  setUpInstance() {
    browser.waitForAngularEnabled(false);
    element(by.css('app-login .has-text-grey a:nth-child(2)')).click();
    element(by.id('protocol')).sendKeys('http');
    element(by.id('host')).clear();
    element(by.id('host')).sendKeys('192.168.1.20');
    element(by.id('service_port')).clear();
    element(by.id('service_port')).sendKeys('8081');
    element(by.css('app-settings button.button.is-primary')).click();
    browser.waitForAngularEnabled(true);
  }

  getNavTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('#app .navbar-brand .navbar-item.is-hidden-mobile b')).getText();
  }

  clickSkip() {
    browser.ignoreSynchronization = true;
    element(by.css('app-login .is-grouped div:nth-child(1) button')).click();
    // wait
    // const EC = browser.ExpectedConditions;
    // browser.wait(EC.visibilityOf(element(by.id('.c-list'))), 1000);
  }

  getFirstGraph() {
    browser.ignoreSynchronization = true;
    // wait
    const EC = browser.ExpectedConditions;
    browser.wait(EC.visibilityOf(element(by.css('app-dashboard div:nth-child(3) div article h5'))), 1000);
    return element(by.css('app-dashboard div:nth-child(3) div article h5')).getText();
  }

  getLastGraph() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-dashboard div:nth-child(5) div article h5')).getText();
  }

  getAppStatus() {
    browser.ignoreSynchronization = true;
    return element(by.css('.navbar-item .tag.is-hidden-mobile')).getText();
  }

  navToAssetReadings() {
    return browser.get('/#/asset');
  }

  getAssetsTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-assets > div > div:nth-child(2) #card-title h5')).getText();
  }

  getAssetReadingsTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-assets > div > div:nth-child(3) #card-title h5')).getText();
  }

  navToAuditLogs() {
    return browser.get('/#/audit');
  }

  getAuditLogsTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('#card-title .title.is-5')).getText();
  }

  isAuditLogRefreshIcon() {
    browser.ignoreSynchronization = true;
    return element(by.binding('#card-title .fa.fa-refresh')).isPresent();
  }

  auditLogCount() {
    browser.ignoreSynchronization = true;
    return element(by.css('#card-title .subtitle.is-6')).getText();
  }

  getAuditLogsSelectTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-audit-log div:nth-child(1) select')).count();
  }

  getAuditLogsInputTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-audit-log input')).count();
  }

  navToSystemLogs() {
    return browser.get('/#/syslog');
  }

  getSystemLogTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('#card-title > div > div.column.is-9 > h5')).getText();
  }

  isSystemLogRefreshIcon() {
    browser.ignoreSynchronization = true;
    return element(by.binding('#card-title .fa.fa-refresh')).isPresent();
  }

  systemLogCount() {
    browser.ignoreSynchronization = true;
    return element(by.css('#card-title .subtitle.is-6')).getText();
  }

  getSystemtLogSelectTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-system-log div:nth-child(1) select')).count();
  }

  getSystemLogInputTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-system-log input')).count();
  }

}