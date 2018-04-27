import { FogLAMPPage } from './app.po';
import { SkipLogin } from './app.skip';

describe('foglampapp App', () => {
  // const page: FogLAMPPage;
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
    expect(skipLogin.getAppStatus()).toEqual('service down');
  });

  it('Should Display Selected Graphs', () => {
    skipLogin.clickSkip();
    expect(skipLogin.getFirstGraph()).toEqual('READINGS Statistics History');
    expect(skipLogin.getLastGraph()).toEqual('PURGED Statistics History');
  });

  it('Should Display Assets & Readings', () => {
    skipLogin.navToAssetReadings();
    expect(skipLogin.getAssetsTitle()).toEqual('Assets');
    expect(skipLogin.getAssetReadingsTitle()).toEqual('Asset Readings');
  });

  it('Should Display Audits Logs', () => {
    skipLogin.navToAuditLogs();
    expect(skipLogin.getAuditLogsTitle()).toEqual('Audit Logs');
    expect(skipLogin.auditLogCount()).toContain('Count');
    expect(skipLogin.getAuditLogsSelectTag()).toEqual(2);
    expect(skipLogin.getAuditLogsInputTag()).toEqual(2);
  });

  it('Should Display System Logs', () => {
    skipLogin.navToAuditLogs();
    expect(skipLogin.getSystemLogTitle()).toEqual('Audit Logs');
    expect(skipLogin.systemLogCount()).toContain('Count');
    expect(skipLogin.getAuditLogsSelectTag()).toEqual(1);
    expect(skipLogin.getAuditLogsInputTag()).toEqual(2);
  });

  // it('Should Display Config Titles', () => {
  //   var ConfigTitles = [
  //     'Sensors and Device Interface',
  //     'Log Partitioning',
  //     'Streaming',
  //     'System Purge',
  //     'CoAP Device',
  //     'Scheduler configuration',
  //     'Device server configuration',
  //     'Configuration of the Sending Process',
  //     'Configuration of OMF types',
  //     'Purge the readings table',
  //     'Configuration of OMF Translator plugin'
  //   ];
  //   page.navigateToConfig();
  //   for (var ConfigTitle in ConfigTitles) {
  //     expect(page.getConfigTitles()).toContain(ConfigTitles[ConfigTitle]);
  //   }
  // });

  // it('Should Display Scheduled Tasks', () => {
  //   page.navToScheduledTasks();
  //   expect(page.getSchedulesTitle()).toEqual('Schedules');
  //   expect(page.getCreateScheduleButton()).toContain('Create');
  //   expect(page.getTasksTitle()).toContain('Tasks');
  // });

  // it('Should Display Audits Logs', () => {
  //   page.navToAuditLogs();
  //   expect(page.getAuditLogsTitle()).toEqual('Audit Logs');
  //   expect(page.getAuditLogsSelectTag()).toEqual(2);
  //   expect(page.getAuditLogsInputTag()).toEqual(2);
  // });

  // it('Should Display Assets & Readings', () => {
  //   page.navToAssetReadings();
  //   expect(page.getAssetsTitle()).toEqual('Assets');
  //   expect(page.getAssetReadingsTitle()).toEqual('Asset Readings');
  // });

  // it('Should Display Service Health', () => {
  //   var ColumnsName = [
  //     'Name',
  //     'Type',
  //     'Protocol',
  //     'Address',
  //     'Service Port',
  //     'Management Port'
  //   ];
  //   page.navToServiceHealth();
  //   expect(page.getServiceStatusTitle()).toContain('Services Status');
  //   expect(page.getRefreshButton()).toEqual(true);

  //   for (var ColumnName in ColumnsName) {
  //     expect(page.getServiceHealthColNames()).toContain(ColumnsName[ColumnName]);
  //   }
  // });

  // it('Should Display Settings', () => {
  //   page.navToSettings();
  //   expect(page.getServiceHealthSelectTag()).toEqual(1);
  //   expect(page.getServiceHealthInputTag()).toEqual(2);
  //   expect(page.getServiceHealthButton()).toEqual('Set the URL & Restart')
  // });
});
