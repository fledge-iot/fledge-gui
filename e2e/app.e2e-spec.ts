import { FogLAMPPage } from './app.po';

describe('foglampapp App', () => {
  let page: FogLAMPPage;

  beforeEach(() => {
    page = new FogLAMPPage();
  });

  it('Should Display Nav Title', () => {
    page.navigateToHome();
    expect(page.getNavTitle()).toEqual('FogLAMP Management');
  });

  it('Should Display App Status', () => {
    page.navigateToHome();
    expect(page.getAppStatus()).toEqual('service down');
  });

  it('Should Display Config Titles', () => {
    var ConfigTitles = [
      'Sensors and Device Interface',
      'Log Partitioning',
      'Streaming',
      'System Purge',
      'CoAP Device',
      'Scheduler configuration',
      'Device server configuration',
      'Configuration of the Sending Process',
      'Configuration of OMF types',
      'Purge the readings table',
      'Configuration of OMF Translator plugin'
    ];
    page.navigateToConfig();
    for (var ConfigTitle in ConfigTitles) {
      expect(page.getConfigTitles()).toContain(ConfigTitles[ConfigTitle]);
    }
  });

  it('Should Display Scheduled Tasks', () => {
    page.navToScheduledTasks();
    expect(page.getSchedulesTitle()).toEqual('Schedules');
    expect(page.getCreateScheduleButton()).toContain('Create');
    expect(page.getTasksTitle()).toContain('Tasks');
  });

  it('Should Display Audits Logs', () => {
    page.navToAuditLogs();
    expect(page.getAuditLogsTitle()).toEqual('Audit Logs');
    expect(page.getAuditLogsSelectTag()).toEqual(2);
    expect(page.getAuditLogsInputTag()).toEqual(2);
  });

  it('Should Display Assets & Readings', () => {
    page.navToAssetReadings();
    expect(page.getAssetsTitle()).toEqual('Assets');
    expect(page.getAssetReadingsTitle()).toEqual('Asset Readings');
  });

  it('Should Display Service Health', () => {
    var ColumnsName = [
      'Name',
      'Type',
      'Protocol',
      'Address',
      'Service Port',
      'Management Port'
    ];
    page.navToServiceHealth();
    expect(page.getServiceStatusTitle()).toEqual('Service Status');
    expect(page.getRefreshButton()).toEqual(true);

    for (var ColumnName in ColumnsName) {
      expect(page.getServiceHealthColNames()).toContain(ColumnsName[ColumnName]);
    }
  });

  it('Should Display Settings', () => {
    page.navToSettings();
    expect(page.getServiceHealthSelectTag()).toEqual(1);
    expect(page.getServiceHealthInputTag()).toEqual(3);
    expect(page.getServiceHealthButton()).toEqual('Set the URL & Restart')
  });
});
