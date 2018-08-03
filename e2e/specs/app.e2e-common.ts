import { AdminLogin } from '../po/app.admin';
import { SkipLogin } from '../po/app.skip';
import { NonAdminLogin } from '../po/app.non-admin';
import { environment } from '../environment';

describe('FogLAMP gui', () => {
  let skipLogin: SkipLogin;
  let adminLogin: AdminLogin;
  let nonAdminLogin: NonAdminLogin;
  let isSetupInstance = false;
  skipLogin = new SkipLogin();
  adminLogin = new AdminLogin();
  nonAdminLogin = new NonAdminLogin();

  beforeEach(() => {
    if (!isSetupInstance) {
      skipLogin.navigateToHome();
      skipLogin.setUpInstance();
      isSetupInstance = true;
    }
  });

  if (environment.AUTH_OPTIONAL === true) {
    it('Should Display Nav Title and App Status', () => {
      skipLogin.navigateToHome();
      expect(skipLogin.getNavTitle()).toEqual('FogLAMP Management');
      expect(skipLogin.getAppStatus()).toEqual('running');
    });

    it('Should Display Default Graphs', () => {
      expect(skipLogin.getCountOfSelectedGraph()).toEqual(3);
      expect(skipLogin.getReadingsGraph()).toEqual('READINGS');
      expect(skipLogin.getPurgedGraph()).toEqual('PURGED');
    });

    it('Should Display Assets & Readings', () => {
      skipLogin.navToAssetReadings();
      expect(skipLogin.getAssetsTitle()).toEqual('Assets');
      expect(skipLogin.getAssetsRefreshButton()).toEqual(true);
      expect(skipLogin.getAssetReadingsTitle()).toEqual('Asset Readings');

      // TODO: Test data required to pass below tests.
      // skipLogin.clickAssetSummary();
      // expect(skipLogin.getAssetSummarySelectTag()).toEqual(1);
      // expect(skipLogin.getAssetSummaryInputTag()).toEqual(1);
      // const ColumnsName = [
      //   'Reading',
      //   'Average',
      //   'Min',
      //   'Max'
      // ];
      // for (const ColumnName in ColumnsName) {
      //   expect(skipLogin.getAssetSummaryColNames()).toContain(ColumnsName[ColumnName]);
      // }
      // expect(skipLogin.isAssetSummaryChartIcon()).toEqual(true);

      // skipLogin.clickChartIcon();
      // expect(skipLogin.isChartDisplayed()).toEqual(true);
      // skipLogin.closeSummaryModal();

      // skipLogin.clickAssetChart();
      // expect(skipLogin.getAssetChartInputTag()).toEqual(2);
      // skipLogin.closeChartModal();
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

    /**
     *  TODO: Fix timing issue for Configuration page
     */
    // it('Should Display Config Titles', () => {
    //   const ConfigTitles = [
    //     'OMF North Plugin Configuration',
    //     'OMF North Statistics Plugin Configuration',
    //     'HTTP North Plugin Configuration',
    //     'HTTP_SOUTH Device',
    //     'OCS North Plugin Configuration',
    //     'South Plugin polling template',
    //     'COAP Device',
    //     'TI SensorTag CC2650 polling South Plugin',
    //     'TI SensorTag CC2650 async South Plugin',
    //     'Scheduler configuration',
    //     'Service Monitor configuration'
    //   ];
    //   skipLogin.navigateToConfig();
    //   for (const ConfigTitle in ConfigTitles) {
    //     expect(skipLogin.getConfigTitles()).toContain(ConfigTitles[ConfigTitle]);
    //   }
    //   expect(skipLogin.isAddButtonPresent()).toEqual(true);
    //   expect(skipLogin.isSaveButtonPresent()).toEqual(true);
    //   expect(skipLogin.isCancelButtonPresent()).toEqual(true);

    //   expect(skipLogin.editAndVerifyConfigValue()).toEqual('Value updated successfully');

    //   skipLogin.clickAddButton();
    //   expect(skipLogin.addConfigInputTagCount()).toEqual(3);
    //   expect(skipLogin.addConfigSelectTagCount()).toEqual(1);
    //   expect(skipLogin.addConfigTextareaCount()).toEqual(1);
    //   expect(skipLogin.isAddConfigSaveButton()).toEqual(true);
    // });

    it('Should Display Scheduled Tasks', () => {
      skipLogin.navToScheduledTasks();
      expect(skipLogin.getSchedulesTitle()).toContain('Schedules');
      expect(skipLogin.getSchedulesRefreshButton()).toEqual(true);
      expect(skipLogin.getCreateScheduleButton()).toContain('Create');
      expect(skipLogin.getTasksTitle()).toContain('Tasks');
      expect(skipLogin.getTasksRefreshButton()).toEqual(true);
      expect(skipLogin.getTasksSelectTag()).toEqual(1);

      expect(skipLogin.createAndVerifySchedule()).toEqual('Schedule created successfully.');
      skipLogin.closeAlert();
      expect(skipLogin.updateAndVerifySchedule()).toEqual('Schedule updated successfully.');
      skipLogin.closeAlert();
      expect(skipLogin.isUpdatedSchedulePresent()).toContain('updateSchedule');
      expect(skipLogin.disableAndVerifySchedule()).toEqual('Schedule successfully disabled');
      skipLogin.closeAlert();
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
      expect(skipLogin.getAddServiceButton()).toContain('Add Service');
      expect(skipLogin.getServiceStatusRefreshButton()).toEqual(true);

      for (const ColumnName in ColumnsName) {
        expect(skipLogin.getServiceHealthColNames()).toContain(ColumnsName[ColumnName]);
      }
      expect(skipLogin.coreServiceStatus()).toContain('running');
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

      expect(skipLogin.getTestConnectionTextButton().count()).toEqual(1);
      expect(skipLogin.getTestConnectionTextButton().get(0).getText()).toEqual('Test Connection');

      expect(skipLogin.getDiscoverFoglampButton().count()).toEqual(1);
      expect(skipLogin.getDiscoverFoglampButton().get(0).getText()).toEqual('Discover FogLAMP Instances');

      expect(skipLogin.getPingDropdown()).toEqual(1);
    });
  } else {
    it('Should Display User Management for Admin', () => {
      // expect(skipLogin.loginPageInputTag()).toEqual(2);
      // expect(skipLogin.getLoginButton()).toEqual('Log In');
      adminLogin.login();
      expect(adminLogin.isUserManagementPresent()).toBe(true);

      adminLogin.navToUserManagement();
      expect(adminLogin.getAllTabs()).toContain('User Management');
      expect(adminLogin.getAllTabs()).toContain('Roles');
      expect(adminLogin.isAddUserPresent()).toContain('Add User');
      const ColumnsName = [
        'ID',
        'Username',
        'Role'
      ];
      for (const ColumnName in ColumnsName) {
        expect(adminLogin.getUserManagementColNames()).toContain(ColumnsName[ColumnName]);
      }
      adminLogin.gotoRoles();
      const RolesColumnsName = [
        'ID',
        'Role'
      ];
      for (const ColumnName in RolesColumnsName) {
        expect(adminLogin.getRolesColNames()).toContain(ColumnsName[ColumnName]);
      }
    });

    it('Should Display Profile for Admin', () => {
      adminLogin.navToProfile();
      expect(adminLogin.profileTitle()).toEqual('Profile');
      expect(adminLogin.labelUsername()).toEqual('Username');
      expect(adminLogin.labelRole()).toEqual('Role');
      expect(adminLogin.isChangePassword()).toEqual('change password');
      expect(adminLogin.isLogoutActiveSessionButton()).toEqual('Logout Active Sessions');

      adminLogin.changePassword();
      expect(adminLogin.getInputTagCount()).toEqual(3);
      expect(adminLogin.isSaveButton()).toEqual(true);
      adminLogin.closeModal();
    });

    it('Should Logout Admin and Login non-admin User', () => {
      adminLogin.logout();
      expect(adminLogin.loginPageInputTag()).toEqual(2);
      expect(adminLogin.getLoginButton()).toEqual('Log In');
      nonAdminLogin.login();
      expect(nonAdminLogin.getLoggedInUsername()).toContain('user');
    });

    it('Should Not Display User Management for Non-Admin', () => {
      expect(nonAdminLogin.isUserManagementPresent()).toBe(false);
    });

    it('Should Display Profile for Non-Admin', () => {
      adminLogin.navToProfile();
      expect(nonAdminLogin.profileTitle()).toEqual('Profile');
      expect(nonAdminLogin.labelUsername()).toEqual('Username');
      expect(nonAdminLogin.labelRole()).toEqual('Role');
      expect(nonAdminLogin.isChangePassword()).toEqual('change password');
      expect(nonAdminLogin.isLogoutActiveSessionButton()).toEqual('Logout Active Sessions');

      nonAdminLogin.changePassword();
      expect(nonAdminLogin.getInputTagCount()).toEqual(3);
      expect(nonAdminLogin.isSaveButton()).toEqual(true);
      nonAdminLogin.closeModal();
    });
  }
});
