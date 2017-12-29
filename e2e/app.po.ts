import { browser, by, element } from 'protractor';

export class FogLAMPPage {
  navigateToHome() {
    return browser.get('/');
  }

  navigateToConfig() {
    return browser.get('/configuration');
  }

  navToScheduledTasks() {
    return browser.get('/scheduled-task');
  }

  navToAuditLogs() {
    return browser.get('/audit');
  }

  navToAssetReadings() {
    return browser.get('/asset');
  }

  navToServiceHealth() {
    return browser.get('/services-health');
  }

  navToSettings() {
    return browser.get('/setting');
  }

  getNavTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('#app .navbar-brand .navbar-item b')).getText();
  }

  getAppStatus() {
    browser.ignoreSynchronization = true;
    return element(by.css('#app .navbar-end span')).getText();
  }

  getConfigTitles() {
    browser.ignoreSynchronization = true;
    return element(by.css('#app app-configuration-manager')).getText();
  }

  getSchedulesTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-scheduled-process .card-header p.card-header-title')).getText();
  }

  getCreateScheduleButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-scheduled-process .card-header .button.is-light')).getText();
  }

  getTasksTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-scheduled-process app-list-tasks header > div')).getText();
  }

  getAuditLogsTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-audit-log .container.is-fluid .card-header-title strong')).getText();
  }

  getAuditLogsSelectTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-audit-log div:nth-child(1) select')).count();
  }

  getAuditLogsInputTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-audit-log input')).count();
  }

  getAssetsTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-assets > div > div:nth-child(2) > div > article > h5 > small')).getText();
  }

  getAssetReadingsTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-assets > div > div:nth-child(3) > div > article > h5 > small')).getText();
  }

  getServiceStatusTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-services-health div:nth-child(1) strong')).getText();
  }

  getRefreshButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('#app app-services-health i')).isDisplayed();
  }

  getServiceHealthColNames() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-services-health table tr')).getText();
  }

  getServiceHealthSelectTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-settings .column .select')).count();
  }

  getServiceHealthInputTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-settings div input')).count();
  }

  getServiceHealthButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-settings button')).getText();
  }
}
