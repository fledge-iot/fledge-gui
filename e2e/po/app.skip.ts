import { environment } from '../environment';

export class SkipLogin {

  navigateToHome() {
    return cy.visit('/')
  }

  setUpInstance() {
    if (environment.HOST === 'localhost' &&
      environment.SERVICE_PORT === '8081') {
      return;
    }
    this.navToSettings()
    cy.get('#protocol-dropdown').click()
    cy.get('#protocol-dropdown #dropdown-menu > div > a:nth-child(1)').click()
    cy.get('#host').clear()
    cy.get('#host').type(environment.HOST)
    cy.get('#service_port').clear()
    cy.get('#service_port').type(environment.SERVICE_PORT)
    cy.get('#set-url-restart-btn').click()
  }

  getNavTitle() {
    return cy.get('#app .navbar-brand .navbar-item > b > a').invoke('text')
  }

  loginPageInputTag() {
    cy.get('app-login form input').should('be.visible')
  }

  getLoginButton() {
    return cy.get('app-login form button.is-info').invoke('text')
  }

  getAppStatus() {
    cy.get('#service-status').should('be.visible')
  }

  getReceived() {
    return cy.get('#received-reading').invoke('text')
  }

  getSent() {
    return cy.get('#sent-reading').invoke('text')
  }

  getUptime() {
    return cy.get('#uptime').invoke('text')
  }

  isDashboardTimeDropdownPresent() {
    cy.get('#time-dropdown').should('be.visible')
  }

  isDashboardGraphDropdownPresent() {
    cy.get('#graph-key-dropdown').should('be.visible')
  }

  navToAssetReadings() {
    return cy.visit('/#/asset')
  }

  getAssetTableHeader() {
    return cy.get('app-assets table th:nth-child(1)').invoke('text')
  }

  getReadingsTableHeader() {
    return cy.get('app-assets table th:nth-child(2)').invoke('text')
  }

  clickChartIcon() {
    return cy.get('app-assets .table.is-striped > tbody:nth-child(2) > tr:nth-child(1) .fa-chart-line').click()
  }

  isChartDisplayed() {
    cy.get('.chart-container').should('be.visible')
  }

  closeChartModal() {
    cy.get('#chart_modal .modal-card > header > div > button').click()
  }

  clickAssetChart() {
    return cy.get('app-assets table tbody:nth-child(2) tr:nth-child(1) td:nth-child(4) a').click()
  }

  getAssetChartInputTag() {
    cy.get('#chart_modal .modal-card app-number-input-debounce input').should('be.visible')
  }

  navToAuditLogs() {
    return cy.visit('/#/logs/audit')
  }

  getAuditLogsTitle() {
    return cy.get('.card-header-title').invoke('text')
  }

  isAuditLogsSourceDropdownPresent() {
    cy.get('.card #dropdown').should('be.visible')
  }

  isAuditLogsSeverityDropdownPresent() {
    cy.get('.card #severity-dropdown').should('be.visible')
  }

  navToSystemLogs() {
    return cy.visit('/#/logs/syslog')
  }

  getSystemLogTitle() {
    return cy.get('.card-header-title').invoke('text')
  }

  isSystemLogDropDownPresent() {
    cy.get('#dropdown').should('be.visible')
  }

  isSystemLogLevelDropdownPresent() {
    cy.get('#level-dropdown').should('be.visible')
  }

  getSystemLogInputTag() {
    cy.get('app-system-log input').should('be.visible')
  }

  navigateToConfig() {
    return cy.visit('/#/configuration')
  }

  clickAddButton() {
    return cy.get('app-configuration-manager > div > div:nth-child(2) > header > div:nth-child(2) > a').click()
  }

  navToScheduledTasks() {
    return cy.visit('/#/schedules')
  }

  getSchedulesTitle() {
    return cy.get('app-list-schedules .card-header p.card-header-title').invoke('text')
  }

  getSchedulesRefreshButton() {
    cy.get('#scheduled-process .fa.fa-sync').should('be.visible')
  }

  getCreateScheduleButton() {
    return cy.get('app-list-schedules .card-header .button.is-light').invoke('text')
  }

  closeAlert() {
    cy.get('#alert > button.delete').click()
  }

  getTasksTitle() {
    return cy.get('app-list-schedules app-list-tasks header > div').invoke('text')
  }

  getTasksRefreshButton() {
    cy.get('app-list-schedules > div:nth-child(2) .fa.fa-sync').should('be.visible')
  }

  getTasksSelectTag() {
    cy.get('#task-state').should('be.visible')
  }

  navToCertificateStore() {
    return cy.visit('/#/certificate')
  }

  getCertificateStoreTitle() {
    return cy.get('app-cert-store > div > div > header > p').invoke('text')
  }

  getCertificateStoreRefreshButton() {
    cy.get('app-cert-store button i').should('be.visible')
  }

  getCertificateStoreKeyColKeyName() {
    return cy.get('app-cert-store div div div div:nth-child(1) table > thead > tr > th:nth-child(1)').invoke('text')
  }

  getCertificateStoreKeyColExtensionName() {
    return cy.get('app-cert-store div div div div:nth-child(1) table > thead > tr > th:nth-child(2)').invoke('text')
  }

  getCertificateStoreCertColKeyName() {
    return cy.get('app-cert-store div div div div:nth-child(2) table > thead > tr > th:nth-child(1)').invoke('text')
  }

  getCertificateStoreCertColExtensionName() {
    return cy.get('app-cert-store div div div div:nth-child(2) table > thead > tr > th:nth-child(2)').invoke('text')
  }

  getCertificateStoreImport() {
    return cy.get('app-cert-store header a').invoke('text')
  }

  navToBackupRestore() {
    return cy.visit('/#/backup-restore');
  }

  clickRequestBackup() {
    cy.get('#dropdown-menu3 .dropdown-content #create-backup').first().click()
    // wait
    cy.wait(15000)
    cy.get('#dropdown-menu3').invoke('hide')
    cy.wait(1000).get('app-backup-restore table thead tr').should('be.visible')
  }

  getBackupRestoreTitle() {
    return cy.get('.card-header-title').invoke('text')
  }

  getBackupRestoreColDateName() {
    return cy.get('app-backup-restore table thead tr th:nth-child(1) div').invoke('text')
  }

  getBackupRestoreColStatusName() {
    return cy.get('app-backup-restore table thead tr th:nth-child(2)').invoke('text')
  }

  getRequestBackup() {
    cy.get('app-backup-restore .dropdown.is-hoverable.is-right').invoke('mouseenter')
    cy.get('#dropdown-menu3').invoke('show')
    return cy.get('#dropdown-menu3 .dropdown-content #create-backup span').invoke('text')
  }

  getCreatedBackupRow() {
    return cy.get('app-backup-restore table tbody tr td:nth-child(2) small').invoke('text')
  }

  deleteBackup() {
    cy.get('app-backup-restore table tbody tr:nth-child(1) div.is-hoverable').invoke('addClass', 'is-active')
    cy.get('#dropdown-menu > div > a:nth-child(1)').click()
    cy.wait(2000).get('#modal-box button.button.is-small.is-danger').should('be.visible')
    cy.get('#modal-box button.button.is-small.is-danger').click()
    cy.wait(3000).get('app-backup-restore .no-rec').should('be.visible')
  }

  noBackupRecord() {
    return cy.get('app-backup-restore .no-rec').invoke('text')
  }

  navToSupportBundles() {
    return cy.visit('/#/support');
  }

  getSupportBundlesTitle() {
    return cy.get('.card-header-title').invoke('text')
  }

  getSupportBundlesRefreshButton() {
    cy.get('app-support button i').should('be.visible')
  }

  getRequestNewBundle() {
    return cy.get('app-support header a').invoke('text')
  }

  requestNewBundle() {
    cy.get('app-support header a').click()
    // wait
    cy.wait(2000).get('#alert').should('be.visible')
    return cy.get('#alert').invoke('text')
  }

  navToSettings() {
    return cy.visit('/#/setting');
  }

  getSettingsTitle() {
    return cy.get('app-settings #connection .card-header .card-header-title').invoke('text')
  }

  getSettingsSelectTag() {
    cy.get('#protocol-dropdown').should('be.visible')
  }

  getSettingsHostInputTag() {
    cy.get('app-settings div input#host').should('be.visible')
  }

  getSettingsPortInputTag() {
    cy.get('app-settings div input#service_port').should('be.visible')
  }

  getSettingsSetUrlAndRestartButton() {
    return cy.get('app-settings #set-url-restart-btn').invoke('text')
  }

  isRefreshDashboardDropdownPresent() {
    cy.get('#refresh-time-dropdown').should('be.visible')
  }

  isPingIntervalDropdownPresent() {
    cy.get('#ping-interval-dropdown').should('be.visible')
  }
}
