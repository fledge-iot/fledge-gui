import { browser, by, element } from 'protractor';
import { environment } from '../environment';

export class SkipLogin {
  EC = browser.ExpectedConditions;

  navigateToHome() {
    return browser.get('/');
  }

  setUpInstance() {
    browser.waitForAngularEnabled(false);
    element(by.css('select option[value="http"]')).click();
    element(by.id('host')).clear();
    element(by.id('host')).sendKeys(environment.HOST);
    element(by.id('service_port')).clear();
    element(by.id('service_port')).sendKeys(environment.SERVICE_PORT);
    element(by.id('set-url-restart-btn')).click();
    browser.waitForAngularEnabled(true);
  }

  getNavTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('#app .navbar-brand .navbar-item.is-hidden-mobile b')).getText();
  }

  loginPageInputTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-login form input')).count();
  }

  getLoginButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-login form button.is-info')).getText();
  }

  getCountOfSelectedGraph() {
    browser.ignoreSynchronization = true;
    // wait
    browser.wait(this.EC.visibilityOf(element(by.css('angular2-multiselect .selected-list .c-list'))), 4000);
    return element.all(by.css('angular2-multiselect .selected-list .c-list div')).count();
  }

  getReadingsGraph() {
    browser.ignoreSynchronization = true;
    // wait
    browser.wait(this.EC.visibilityOf(element(by.css('app-dashboard div:nth-child(3) div article h5'))), 2000);
    return element(by.css('app-dashboard div:nth-child(3) div article h5')).getText();
  }

  getPurgedGraph() {
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

  getAssetsRefreshButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-assets > div > div:nth-child(2) #card-title > h5 > button > i')).isDisplayed();
  }

  clickAssetSummary() {
    browser.ignoreSynchronization = true;
    // wait
    browser.wait(this.EC.visibilityOf(element(by.css('app-assets table tbody:nth-child(2) tr:nth-child(1) td:nth-child(3) a'))), 3000);
    return element(by.css('app-assets table tbody:nth-child(2) tr:nth-child(1) td:nth-child(3) a')).click();
  }

  getAssetSummarySelectTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('#summary_modal select')).count();
  }

  getAssetSummaryInputTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('#summary_modal app-number-input-debounce > input')).count();
  }

  getAssetSummaryColNames() {
    browser.ignoreSynchronization = true;
    return element(by.css('#summary_modal table thead tr')).getText();
  }

  isAssetSummaryChartIcon() {
    browser.ignoreSynchronization = true;
    return element(by.css('#summary_modal table th:nth-child(5) a')).isDisplayed();
  }

  clickChartIcon() {
    browser.ignoreSynchronization = true;
    return element(by.css('#summary_modal table th:nth-child(5) a')).click();
  }

  isChartDisplayed() {
    browser.ignoreSynchronization = true;
    return element(by.css('.chartjs-render-monitor')).isDisplayed();
  }

  closeSummaryModal() {
    browser.ignoreSynchronization = true;
    return element(by.css('#summary_modal .modal-card header button')).click();
  }

  clickAssetChart() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-assets table tbody:nth-child(2) tr:nth-child(1) td:nth-child(4) a')).click();
  }

  getAssetChartInputTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('#chart_modal .modal-card app-number-input-debounce input')).count();
  }

  closeChartModal() {
    browser.ignoreSynchronization = true;
    return element(by.css('#chart_modal .modal-card header button')).click();
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
    return element(by.css('#card-title .fa.fa-refresh')).isDisplayed();
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

  getSysLogRefreshButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('#card-title .fa.fa-refresh')).isDisplayed();
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

  navigateToConfig() {
    return browser.get('/#/configuration');
  }

  getConfigTitles() {
    browser.ignoreSynchronization = true;
    // wait
    browser.wait(this.EC.visibilityOf(element(by.css('app-root app-configuration-manager > div > div:nth-child(2)'))), 5 * 1000);
    return element(by.css('#app > app-root > ng-sidebar-container > div > div > app-configuration-manager > div')).getText();
  }

  isAddButtonPresent() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-configuration-manager > div > div:nth-child(2) > header > div:nth-child(2) > a')).isDisplayed();
  }

  isSaveButtonPresent() {
    browser.ignoreSynchronization = true;
    return element(by.id('btn-save-send_pr_1-plugin')).isDisplayed();
  }

  isCancelButtonPresent() {
    browser.ignoreSynchronization = true;
    return element(by.id('btn-cancel-send_pr_1-plugin')).isDisplayed();
  }

  clickAddButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-configuration-manager > div > div:nth-child(2) > header > div:nth-child(2) > a')).click();
  }

  addConfigInputTagCount() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('#add-config-item .modal-card .modal-card-body form input')).count();
  }

  addConfigSelectTagCount() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('#add-config-item .modal-card form select')).count();
  }

  addConfigTextareaCount() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('#add-config-item .modal-card form textarea')).count();
  }

  isAddConfigSaveButton() {
    browser.ignoreSynchronization = true;
    return element(by.id('save')).isDisplayed();
  }

  editAndVerifyConfigValue() {
    browser.waitForAngularEnabled(false);
    element(by.id('send_pr_1-plugin')).clear();
    element(by.id('send_pr_1-plugin')).sendKeys('test');
    element(by.id('btn-save-send_pr_1-plugin')).click();
    // wait
    browser.wait(this.EC.visibilityOf(element(by.id('alert'))), 2000);
    return element(by.id('alert')).getText();
  }

  navToScheduledTasks() {
    return browser.get('/#/scheduled-task');
  }

  getSchedulesTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-scheduled-process .card-header p.card-header-title')).getText();
  }

  getSchedulesRefreshButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-scheduled-process > div:nth-child(2) .fa.fa-refresh')).isDisplayed();
  }

  getCreateScheduleButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-scheduled-process .card-header .button.is-light')).getText();
  }

  createAndVerifySchedule() {
    browser.ignoreSynchronization = true;
    element(by.css('app-scheduled-process .card-header .button.is-light')).click();
    element(by.css('#create_schedule_modal form > div:nth-child(1) > div:nth-child(1) > div > div > p > input')).sendKeys('test');
    element(by.css('#create_schedule_modal .modal-card #repeat_day')).sendKeys('1');
    element(by.css('#create_schedule_modal .modal-card #repeat_time')).sendKeys('11:11:11');
    browser.sleep(2000);
    element(by.css('#create_schedule_modal #save')).click();
    // wait
    browser.wait(this.EC.visibilityOf(element(by.id('alert'))), 2000);
    return element(by.id('alert')).getText();
  }

  closeAlert() {
    browser.ignoreSynchronization = true;
    element(by.css('#alert > button.delete')).click();
  }

  updateAndVerifySchedule() {
    browser.ignoreSynchronization = true;
    // Scroll the element (created schedule) to view
    const lastElement = element(by.xpath('//*[@id="test"]'));
    browser.executeScript('arguments[0].scrollIntoView()', lastElement.getWebElement());

    element(by.css('#test > td:nth-child(7) > a[name=test]')).click();
    element(by.css('#update_schedule_modal form > div:nth-child(1) > div:nth-child(1) > div > div > p > input')).clear();
    element(by.css('#update_schedule_modal form > div:nth-child(1) > div:nth-child(1) > div > div > p > input')).sendKeys('updateSchedule');
    browser.sleep(1000);
    element(by.css('#update_schedule_modal #save')).click();
    // wait
    browser.wait(this.EC.visibilityOf(element(by.id('alert'))), 2000);
    return element(by.id('alert')).getText();
  }

  isUpdatedSchedulePresent() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-scheduled-process > div:nth-child(2) .card-content')).getText();
  }

  disableAndVerifySchedule() {
    browser.ignoreSynchronization = true;
    element(by.css('#updateSchedule > td:nth-child(9) > button[name=updateSchedule]')).click();
    element(by.css('#modal-box > div.modal-card > footer > button.button.is-success')).click();
    // wait
    browser.wait(this.EC.visibilityOf(element(by.id('alert'))), 2000);
    return element(by.id('alert')).getText();
  }

  deleteAndVerifySchedule() {
    browser.ignoreSynchronization = true;
    element(by.css
      ('#updateSchedule > td:nth-child(8) > a[name=updateSchedule]')).click();
    element(by.css('#modal-box > div.modal-card > footer > button.button.is-success')).click();
    // wait
    browser.wait(this.EC.visibilityOf(element(by.id('alert'))), 2000);
    return element(by.id('alert')).getText();
  }

  getTasksTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-scheduled-process app-list-tasks header > div')).getText();
  }

  getTasksRefreshButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-scheduled-process > div:nth-child(2) .fa.fa-refresh')).isDisplayed();
  }

  getTasksSelectTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.id('task-state')).count();
  }

  navToServiceHealth() {
    return browser.get('/#/services-health');
  }

  getServiceStatusTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-services-health .title.is-5')).getText();
  }

  getAddServiceButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-services-health #add_service.button')).getText();
  }

  getServiceStatusRefreshButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-services-health header button .fa.fa-refresh')).isDisplayed();
  }

  getServiceHealthColNames() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-services-health table thead tr')).getText();
  }

  coreServiceStatus() {
    browser.ignoreSynchronization = true;
    // wait
    browser.wait(this.EC.visibilityOf(element(by.css('#FogLAMP_Core td:nth-child(2) div span'))), 4000);
    return element(by.css('#FogLAMP_Core td:nth-child(2) div span')).getText();
  }

  shutdownHttpSouth() {
    browser.ignoreSynchronization = true;
    element(by.css('#HTTP_SOUTH > td:nth-child(8) > button')).click();
    element(by.css('#modal-box footer .button.is-success')).click();
    // wait
    browser.wait(this.EC.visibilityOf(element(by.id('alert'))), 8000);
  }

  navToCertificateStore() {
    return browser.get('/#/certificate');
  }

  getCertificateStoreTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-cert-store > div > div > header > p')).getText();
  }

  getCertificateStoreRefreshButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-cert-store button i')).isDisplayed();
  }

  getCertificateStoreColNames() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-cert-store table thead tr')).getText();
  }

  getCertificateStoreImport() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-cert-store header a')).getText();
  }

  isKeyPresent() {
    browser.ignoreSynchronization = true;
    // wait
    browser.wait(this.EC.visibilityOf(element(by.css('app-cert-store table tr:nth-child(1) td:nth-child(2) .fa.fa-check-circle-o'))), 2000);
    return element(by.css('app-cert-store table tr:nth-child(1) td:nth-child(2) .fa.fa-check-circle-o')).isDisplayed();
  }

  isCertificatePresent() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-cert-store table tr:nth-child(1) td:nth-child(3) .fa.fa-check-circle-o')).isDisplayed();
  }

  navToBackupRestore() {
    return browser.get('/#/backup-restore');
  }

  getBackupRestoreTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-backup-restore header p')).getText();
  }

  getBackupRestoreRefreshButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-backup-restore button i')).isDisplayed();
  }

  getBackupRestoreColNames() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-backup-restore table thead tr')).getText();
  }

  getRequestBackup() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-backup-restore header a')).getText();
  }

  navToSupportBundles() {
    return browser.get('/#/support');
  }

  getSupportBundlesTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-support header p')).getText();
  }

  getSupportBundlesRefreshButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-support button i')).isDisplayed();
  }

  getRequestNewBundle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-support header a')).getText();
  }

  requestNewBundle() {
    browser.ignoreSynchronization = true;
    element(by.css('app-support header a')).click();
    // wait
    browser.wait(this.EC.visibilityOf(element(by.id('alert'))), 2000);
    return element(by.id('alert')).getText();
  }

  navToSettings() {
    return browser.get('/#/setting');
  }

  getSettingsTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-settings header p.card-header-title')).getText();
  }

  getSettingsSelectTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-settings .column .select #protocol')).count();
  }

  getSettingsHostInputTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-settings div input#host')).count();
  }

  getSettingsPortInputTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-settings div input#service_port')).count();
  }

  getSettingsSetUrlAndRestartButton() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-settings #set-url-restart-btn'));
  }

  getTestConnectionTextButton() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-settings #test-connection-btn'));
  }

  getDiscoverFoglampButton() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-settings #discover-foglamp-btn'));
  }

  getPingDropdown() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-settings header div.select.is-small')).count();
  }
}
