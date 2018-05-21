import { FogLAMPPage } from './app.po';
import { SkipLogin } from './app.skip';
import { skip } from 'rxjs/operator/skip';

describe('FogLAMP gui', () => {
  let skipLogin: SkipLogin;
  let isSetupInstance = false;

  beforeEach(() => {
    skipLogin = new SkipLogin();
    skipLogin.navigateToHome();
    if (!isSetupInstance) {
      skipLogin.setUpInstance();
      isSetupInstance = true;
    }
  });

  it('Should Display Nav Title and App Status', () => {
    skipLogin.navigateToHome();
    expect(skipLogin.getNavTitle()).toEqual('FogLAMP Management');
    expect(skipLogin.getAppStatus()).toEqual('running');
  });

  it('Should Display Default Graphs', () => {
    skipLogin.clickSkip();
    expect(skipLogin.getCountOfSelectedGraph()).toEqual(3);
    expect(skipLogin.getReadingsGraph()).toEqual('READINGS Statistics History');
    expect(skipLogin.getSent1Graph()).toEqual('SENT_1 Statistics History');
    expect(skipLogin.getPurgedGraph()).toEqual('PURGED Statistics History');
  });

  it('Should Display Assets & Readings', () => {
    skipLogin.navToAssetReadings();
    expect(skipLogin.getAssetsTitle()).toEqual('Assets');
    expect(skipLogin.getAssetsRefreshButton()).toEqual(true);
    expect(skipLogin.getAssetReadingsTitle()).toEqual('Asset Readings');

    skipLogin.clickAssetSummary();
    expect(skipLogin.getAssetSummarySelectTag()).toEqual(1);
    expect(skipLogin.getAssetSummaryInputTag()).toEqual(1);
    const ColumnsName = [
      'Reading',
      'Average',
      'Min',
      'Max'
    ];
    for (const ColumnName in ColumnsName) {
      expect(skipLogin.getAssetSummaryColNames()).toContain(ColumnsName[ColumnName]);
    }
    expect(skipLogin.isAssetSummaryChartIcon()).toEqual(true);

    skipLogin.clickChartIcon();
    expect(skipLogin.isChartDisplayed()).toEqual(true);
    skipLogin.closeSummaryModal();

    skipLogin.clickAssetChart();
    expect(skipLogin.getAssetChartInputTag()).toEqual(2);
    skipLogin.closeChartModal();
  });

  it('Should Display Audits Logs', () => {
    skipLogin.navToAuditLogs();
    expect(skipLogin.getAuditLogsTitle()).toEqual('Audit Logs');
    expect(skipLogin.auditLogCount()).toContain('Count');
    expect(skipLogin.isAuditLogRefreshIcon()).toEqual(true);
    expect(skipLogin.getAuditLogsSelectTag()).toEqual(2);
    expect(skipLogin.getAuditLogsInputTag()).toEqual(2);
  });

  it('Should Display System Logs', () => {
    skipLogin.navToSystemLogs();
    expect(skipLogin.getSystemLogTitle()).toEqual('SysLog');
    expect(skipLogin.systemLogCount()).toContain('Count');
    expect(skipLogin.getSysLogRefreshButton()).toEqual(true);
    expect(skipLogin.getSystemtLogSelectTag()).toEqual(1);
    expect(skipLogin.getSystemLogInputTag()).toEqual(2);
  });

  it('Should Display Config Titles', () => {
    const ConfigTitles = [
      'OMF North Plugin Configuration',
      'OMF North Statistics Plugin Configuration',
      'HTTP North Plugin Configuration',
      'HTTP_SOUTH Device',
      'OCS North Plugin Configuration',
      'South Plugin polling template',
      'COAP Device',
      'TI SensorTag CC2650 polling South Plugin',
      'TI SensorTag CC2650 async South Plugin',
      'Scheduler configuration',
      'Service Monitor configuration'
    ];
    skipLogin.navigateToConfig();
    for (const ConfigTitle in ConfigTitles) {
      expect(skipLogin.getConfigTitles()).toContain(ConfigTitles[ConfigTitle]);
    }
    expect(skipLogin.isAddButtonPresent()).toEqual(true);
    expect(skipLogin.isSaveButtonPresent()).toEqual(true);
    expect(skipLogin.isCancelButtonPresent()).toEqual(true);

    expect(skipLogin.editAndVerifyConfigValue()).toEqual('Value updated successfully');

    skipLogin.clickAddButton();
    expect(skipLogin.addConfigInputTagCount()).toEqual(3);
    expect(skipLogin.addConfigSelectTagCount()).toEqual(1);
    expect(skipLogin.addConfigTextareaCount()).toEqual(1);
    expect(skipLogin.isAddConfigSaveButton()).toEqual(true);
  });

  it('Should Display Scheduled Tasks', () => {
    skipLogin.navToScheduledTasks();
    expect(skipLogin.getSchedulesTitle()).toContain('Schedules');
    expect(skipLogin.getSchedulesRefreshButton()).toEqual(true);
    expect(skipLogin.getCreateScheduleButton()).toContain('Create');
    expect(skipLogin.getTasksTitle()).toContain('Tasks');
    expect(skipLogin.getTasksRefreshButton()).toEqual(true);
    expect(skipLogin.getTasksSelectTag()).toEqual(1);

    expect(skipLogin.createAndVerifySchedule()).toEqual('Schedule created successfully.');

    expect(skipLogin.updateAndVerifySchedule()).toEqual('Schedule updated successfully.');
    expect(skipLogin.isUpdatedSchedulePresent()).toContain('updateSchedule');

    expect(skipLogin.disableAndVerifySchedule()).toEqual('Schedule successfully disabled');

    expect(skipLogin.deleteAndVerifySchedule()).toEqual('Schedule deleted successfully.');
  });

  it('Should Display Service Health', () => {
    const ColumnsName = [
      'Name',
      'Status',
      'Type',
      'Protocol',
      'Address',
      'Service Port',
      'Management Port'
    ];
    skipLogin.navToServiceHealth();
    expect(skipLogin.getServiceStatusTitle()).toContain('Services Status');
    expect(skipLogin.getServiceStatusRefreshButton()).toEqual(true);

    for (const ColumnName in ColumnsName) {
      expect(skipLogin.getServiceHealthColNames()).toContain(ColumnsName[ColumnName]);
    }

    expect(skipLogin.httpSouthServiceStatus()).toContain('running');
    skipLogin.shutdownHttpSouth();
    expect(skipLogin.httpSouthServiceStatus()).toContain('down');
  });

  it('Should Display Certificate Store', () => {
    const ColumnsName = [
      'Name',
      'Key',
      'Certificate'
    ];
    skipLogin.navToCertificateStore();
    expect(skipLogin.getCertificateStoreTitle()).toContain('Certificate Store');
    expect(skipLogin.getCertificateStoreRefreshButton()).toEqual(true);
    for (const ColumnName in ColumnsName) {
      expect(skipLogin.getCertificateStoreColNames()).toContain(ColumnsName[ColumnName]);
    }
    expect(skipLogin.getCertificateStoreImport()).toContain('Import');

    expect(skipLogin.isKeyPresent()).toEqual(true);
    expect(skipLogin.isCertificatePresent()).toEqual(true);
  });

  it('Should Display Backup & Restore', () => {
    const ColumnsName = [
      'Date & Time',
      'Status'
    ];
    skipLogin.navToBackupRestore();
    expect(skipLogin.getBackupRestoreTitle()).toContain('Backup');
    expect(skipLogin.getBackupRestoreRefreshButton()).toEqual(true);
    for (const ColumnName in ColumnsName) {
      expect(skipLogin.getBackupRestoreColNames()).toContain(ColumnsName[ColumnName]);
    }
    expect(skipLogin.getRequestBackup()).toContain('Request Backup');
  });

  it('Should Display Support Bundles', () => {
    skipLogin.navToSupportBundles();
    expect(skipLogin.getSupportBundlesTitle()).toContain('Support Bundles');
    expect(skipLogin.getSupportBundlesRefreshButton()).toEqual(true);
    expect(skipLogin.getRequestNewBundle()).toContain('Request New');
    expect(skipLogin.requestNewBundle()).toContain('Support bundle created successfully');
  });

  it('Should Display Settings', () => {
    skipLogin.navToSettings();
    expect(skipLogin.getSettingsTitle()).toContain('Settings');
    expect(skipLogin.getSettingsSelectTag()).toEqual(1);
    expect(skipLogin.getSettingsHostInputTag()).toEqual(1);
    expect(skipLogin.getSettingsPortInputTag()).toEqual(1);

    expect(skipLogin.getSettingsSetUrlAndRestartButton().count()).toEqual(1);
    expect(skipLogin.getSettingsSetUrlAndRestartButton().get(0).getText()).toEqual('Set the URL & Restart');

    expect(skipLogin.getLoginTextButton().count()).toEqual(1);
    expect(skipLogin.getLoginTextButton().get(0).getText()).toEqual('Login');

    expect(skipLogin.getTestConnectionTextButton().count()).toEqual(1);
    expect(skipLogin.getTestConnectionTextButton().get(0).getText()).toEqual('Test Connection');

    expect(skipLogin.getPingDropdown()).toEqual(1);
  });
});
