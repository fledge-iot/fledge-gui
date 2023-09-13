import { AdminLogin } from '../po/app.admin';
import { SkipLogin } from '../po/app.skip';
import { NonAdminLogin } from '../po/app.non-admin';
import { environment } from '../environment';

describe('Fledge gui', () => {
  let skipLogin: SkipLogin;
  let adminLogin: AdminLogin;
  let nonAdminLogin: NonAdminLogin;
  let isSetupInstance = false;

  skipLogin = new SkipLogin();
  adminLogin = new AdminLogin();
  nonAdminLogin = new NonAdminLogin();

  before(() => {
    if (!isSetupInstance) {
      skipLogin.navigateToHome();
      skipLogin.setUpInstance();
      isSetupInstance = true;
    }
  });

  if (environment.AUTH_OPTIONAL === true) {
    // it('Should Display Nav Title and App Status', () => {
    //   skipLogin.navigateToHome();
    //   skipLogin.getNavTitle().then(title =>{
    //     expect(title.trim()).to.equal('Fledge')
    //   })
    //   skipLogin.getAppStatus()
    //   skipLogin.getReceived().then(received =>{
    //     expect(received.split(':')[0].trim()).to.equal('Received')
    //   })
    //   skipLogin.getSent().then(sent =>{
    //     expect(sent.split(':')[0].trim()).to.equal('Sent')
    //   })
    //   skipLogin.getUptime().then(uptime =>{
    //     expect(uptime.split(':')[0].trim()).to.equal('Uptime')
    //   })
    // });

    // it('Should Display Dashboard', () => {
    //   skipLogin.navigateToHome();
    //   skipLogin.isDashboardTimeDropdownPresent()
    //   skipLogin.isDashboardGraphDropdownPresent()
    // });

    // TODO: Test data required to pass below tests.
    // it('Should Display Assets & Readings', () => {
    // skipLogin.navToAssetReadings();
    // expect(skipLogin.getAssetTableHeader()).toEqual('Asset');
    // expect(skipLogin.getReadingsTableHeader()).toEqual('Readings');

    // skipLogin.clickChartIcon();
    // expect(skipLogin.isChartDisplayed()).toEqual(true);
    // skipLogin.closeChartModal();
    // });

    // it('Should Display Audits Logs', () => {
    //   skipLogin.navToAuditLogs();
    //   skipLogin.getAuditLogsTitle().then(title =>{
    //     expect(title.trim()).to.equal('Audit Logs')
    //   })
    //   skipLogin.isAuditLogsSourceDropdownPresent()
    //   skipLogin.isAuditLogsSeverityDropdownPresent()
    // });

    // it('Should Display System Logs', () => {
    //   skipLogin.navToSystemLogs();
    //   skipLogin.getSystemLogTitle().then(title =>{
    //     expect(title.trim()).to.equal('System Logs')
    //   })
    //   skipLogin.isSystemLogDropDownPresent()
    //   skipLogin.isSystemLogLevelDropdownPresent()
    //   skipLogin.getSystemLogInputTag()
    // });

    // it('Should Display Scheduled Tasks', () => {
    //   skipLogin.navToScheduledTasks();
    //   skipLogin.getSchedulesTitle().then(title =>{
    //     expect(title.trim()).to.equal('Schedules')
    //   })
    //   skipLogin.getSchedulesRefreshButton()
    // });

    // it('Should Display Certificate Store', () => {
    //   skipLogin.navToCertificateStore();
    //   skipLogin.getCertificateStoreTitle().then(title =>{
    //     expect(title.trim()).to.equal('Certificate Store')
    //   })
    //   skipLogin.getCertificateStoreRefreshButton()
    //   skipLogin.getCertificateStoreKeyColKeyName().then(columnName =>{
    //     expect(columnName.trim()).to.equal('Key')
    //   })
    //   skipLogin.getCertificateStoreKeyColExtensionName().then(columnName =>{
    //     expect(columnName.trim()).to.equal('Extension')
    //   })
    //   skipLogin.getCertificateStoreCertColKeyName().then(columnName =>{
    //     expect(columnName.trim()).to.equal('Certificate')
    //   })
    //   skipLogin.getCertificateStoreCertColExtensionName().then(columnName =>{
    //     expect(columnName.trim()).to.equal('Extension')
    //   })
    //   skipLogin.getCertificateStoreImport().then(importText =>{
    //     expect(importText.trim()).to.equal('Import')
    //   })
    // });

    // it('Should Display Backup & Restore', () => {
    //   skipLogin.navToBackupRestore();
    //   skipLogin.getBackupRestoreTitle().then(title =>{
    //     expect(title.trim()).to.equal('Backups')
    //   })
    //   skipLogin.noBackupRecord().then(recordText =>{
    //     expect(recordText.trim()).to.equal('No Record')
    //   })
    //   skipLogin.getRequestBackup().then(result =>{
    //     expect(result.trim()).to.equal('Create New')
    //   })
    //   skipLogin.clickRequestBackup();
    //   skipLogin.getBackupRestoreColDateName().then(columnName =>{
    //     expect(columnName.trim()).to.equal('Date & Time')
    //   })
    //   skipLogin.getBackupRestoreColStatusName().then(columnName =>{
    //     expect(columnName.trim()).to.equal('Status')
    //   })
    //   skipLogin.getCreatedBackupRow().then(result =>{
    //     expect(result.trim()).to.equal('COMPLETED')
    //   })
    //   skipLogin.deleteBackup();
    //   skipLogin.noBackupRecord().then(recordText =>{
    //     expect(recordText.trim()).to.equal('No Record')
    //   })
    // });

    // it('Should Display Support Bundles', () => {
    //   skipLogin.navToSupportBundles();
    //   skipLogin.getSupportBundlesTitle().then(title =>{
    //     expect(title.trim()).to.equal('Support Bundles')
    //   })
    //   skipLogin.getSupportBundlesRefreshButton()
    //   skipLogin.getRequestNewBundle().then(result =>{
    //     expect(result.trim()).to.equal('Request New')
    //   })
    //   skipLogin.requestNewBundle().then(result =>{
    //     expect(result.trim()).to.equal('Support bundle created successfully')
    //   })
    // });

    // it('Should Display Settings', () => {
    //   skipLogin.navToSettings();
    //   skipLogin.getSettingsTitle().then(result =>{
    //     expect(result.trim()).to.equal('Connection Setup')
    //   })
    //   skipLogin.getSettingsSelectTag()
    //   skipLogin.getSettingsHostInputTag()
    //   skipLogin.getSettingsPortInputTag()
    //   skipLogin.getSettingsSetUrlAndRestartButton().then(result =>{
    //     expect(result.trim()).to.equal('Set the URL & Restart')
    //   })
    //   skipLogin.isRefreshDashboardDropdownPresent()
    //   skipLogin.isPingIntervalDropdownPresent()
    // });
  } else {
    // it('Should Display User Management for Admin', () => {
    //   // expect(skipLogin.loginPageInputTag()).toEqual(2);
    //   // expect(skipLogin.getLoginButton()).toEqual('Log In');
    //   adminLogin.login();
    //   expect(adminLogin.isUserManagementPresent()).toBe(true);

    //   adminLogin.navToUserManagement();
    //   expect(adminLogin.getAllTabs()).toContain('User Management');
    //   expect(adminLogin.getAllTabs()).toContain('Roles');
    //   expect(adminLogin.isAddUserPresent()).toContain('Add User');
    //   const ColumnsName = [
    //     'ID',
    //     'Username',
    //     'Role'
    //   ];
    //   for (const ColumnName in ColumnsName) {
    //     expect(adminLogin.getUserManagementColNames()).toContain(ColumnsName[ColumnName]);
    //   }
    //   adminLogin.gotoRoles();
    //   const RolesColumnsName = [
    //     'ID',
    //     'Role'
    //   ];
    //   for (const ColumnName in RolesColumnsName) {
    //     expect(adminLogin.getRolesColNames()).toContain(ColumnsName[ColumnName]);
    //   }
    // });

    // it('Should Display Profile for Admin', () => {
    //   adminLogin.navToProfile();
    //   expect(adminLogin.profileTitle()).toEqual('Profile');
    //   expect(adminLogin.labelUsername()).toEqual('Username');
    //   expect(adminLogin.labelRole()).toEqual('Role');
    //   expect(adminLogin.isChangePassword()).toEqual('change password');
    //   expect(adminLogin.isLogoutActiveSessionButton()).toEqual('Logout Active Sessions');

    //   adminLogin.changePassword();
    //   expect(adminLogin.getInputTagCount()).toEqual(3);
    //   expect(adminLogin.isSaveButton()).toEqual(true);
    //   adminLogin.closeModal();
    // });

    // it('Should Logout Admin and Login non-admin User', () => {
    //   adminLogin.logout();
    //   expect(adminLogin.loginPageInputTag()).toEqual(2);
    //   expect(adminLogin.getLoginButton()).toEqual('Log In');
    //   nonAdminLogin.login();
    //   expect(nonAdminLogin.getLoggedInUsername()).toContain('user');
    // });

    // it('Should Not Display User Management for Non-Admin', () => {
    //   expect(nonAdminLogin.isUserManagementPresent()).toBe(false);
    // });

    // it('Should Display Profile for Non-Admin', () => {
    //   adminLogin.navToProfile();
    //   expect(nonAdminLogin.profileTitle()).toEqual('Profile');
    //   expect(nonAdminLogin.labelUsername()).toEqual('Username');
    //   expect(nonAdminLogin.labelRole()).toEqual('Role');
    //   expect(nonAdminLogin.isChangePassword()).toEqual('change password');
    //   expect(nonAdminLogin.isLogoutActiveSessionButton()).toEqual('Logout Active Sessions');

    //   nonAdminLogin.changePassword();
    //   expect(nonAdminLogin.getInputTagCount()).toEqual(3);
    //   expect(nonAdminLogin.isSaveButton()).toEqual(true);
    //   nonAdminLogin.closeModal();
    // });
  }
});
