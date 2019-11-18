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

  beforeAll(() => {
    if (!isSetupInstance) {
      skipLogin.navigateToHome();
      skipLogin.setUpInstance();
      isSetupInstance = true;
    }
  });

  if (environment.AUTH_OPTIONAL === true) {
    it('Should Display Nav Title and App Status', () => {
      skipLogin.navigateToHome();
      expect(skipLogin.getNavTitle()).toEqual('FogLAMP');
      expect(skipLogin.getAppStatus()).toEqual(true);
      expect(skipLogin.getReceived()).toContain('Received');
      expect(skipLogin.getSent()).toContain('Sent');
      expect(skipLogin.getUptime()).toContain('Uptime');
    });

    it('Should Display Dashboard', () => {
      expect(skipLogin.isDashboardTimeDropdownPresent()).toEqual(true);
      expect(skipLogin.isDashboardGraphDropdownPresent()).toEqual(true);
    });

    // TODO: Test data required to pass below tests.
    // it('Should Display Assets & Readings', () => {
    // skipLogin.navToAssetReadings();
    // expect(skipLogin.getAssetTableHeader()).toEqual('Asset');
    // expect(skipLogin.getReadingsTableHeader()).toEqual('Readings');

    // skipLogin.clickChartIcon();
    // expect(skipLogin.isChartDisplayed()).toEqual(true);
    // skipLogin.closeChartModal();
    // });

    it('Should Display Audits Logs', () => {
      skipLogin.navToAuditLogs();
      expect(skipLogin.getAuditLogsTitle()).toEqual('Audit Logs');
      expect(skipLogin.auditLogCount()).toContain('Count');
      expect(skipLogin.isAuditLogRefreshIcon()).toEqual(true);
      expect(skipLogin.isAuditLogsSourceDropdownPresent()).toEqual(true);
      expect(skipLogin.isAuditLogsSeverityDropdownPresent()).toEqual(true);
      expect(skipLogin.getAuditLogsInputTag()).toEqual(2);
    });

    it('Should Display System Logs', () => {
      skipLogin.navToSystemLogs();
      expect(skipLogin.getSystemLogTitle()).toEqual('System Logs');
      expect(skipLogin.systemLogCount()).toContain('Count');
      expect(skipLogin.getSysLogRefreshButton()).toEqual(true);
      expect(skipLogin.isSystemLogDropDownPresent()).toEqual(true);
      expect(skipLogin.isSystemLogLevelDropdownPresent()).toEqual(true);
      expect(skipLogin.getSystemLogInputTag()).toEqual(2);
    });

    it('Should Display Scheduled Tasks', () => {
      skipLogin.navToScheduledTasks();
      expect(skipLogin.getSchedulesTitle()).toContain('Schedules');
      expect(skipLogin.getSchedulesRefreshButton()).toEqual(true);
    });

    it('Should Display Certificate Store', () => {
      const KeyColumnsName = [
        'Key',
        'Extension'
      ];
      const CertificateColumnsName = [
        'Certificate',
        'Extension'
      ];
      skipLogin.navToCertificateStore();
      expect(skipLogin.getCertificateStoreTitle()).toContain('Certificate Store');
      expect(skipLogin.getCertificateStoreRefreshButton()).toEqual(true);
      for (const ColumnName in KeyColumnsName) {
        expect(skipLogin.getCertificateStoreKeyColNames()).toContain(KeyColumnsName[ColumnName]);
      }
      for (const ColumnName in CertificateColumnsName) {
        expect(skipLogin.getCertificateStoreCertColNames()).toContain(CertificateColumnsName[ColumnName]);
      }
      expect(skipLogin.getCertificateStoreImport()).toContain('Import');
    });

    it('Should Display Backup & Restore', () => {
      const ColumnsName = [
        'Date & Time',
        'Status'
      ];
      skipLogin.navToBackupRestore();
      skipLogin.clickRequestBackup();
      expect(skipLogin.getBackupRestoreTitle()).toContain('Backups');
      for (const ColumnName in ColumnsName) {
        expect(skipLogin.getBackupRestoreColNames()).toContain(ColumnsName[ColumnName]);
      }
      expect(skipLogin.getRequestBackup()).toContain('Create New');
      // Delete backup
      skipLogin.deleteBackup();
      expect(skipLogin.noBackupRecord()).toContain('No Record');
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
      expect(skipLogin.getSettingsTitle()).toContain('Connection Setup');
      expect(skipLogin.getSettingsSelectTag()).toEqual(1);
      expect(skipLogin.getSettingsHostInputTag()).toEqual(1);
      expect(skipLogin.getSettingsPortInputTag()).toEqual(1);

      expect(skipLogin.getSettingsSetUrlAndRestartButton().count()).toEqual(1);
      expect(skipLogin.getSettingsSetUrlAndRestartButton().get(0).getText()).toEqual('Set the URL & Restart');

      expect(skipLogin.isRefreshDashboardDropdownPresent()).toEqual(true);
      expect(skipLogin.isPingIntervalDropdownPresent()).toEqual(true);
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
