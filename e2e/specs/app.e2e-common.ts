import { AdminLogin } from '../po/app.admin';
import { SkipLogin } from '../po/app.skip';
import { NonAdminLogin } from '../po/app.non-admin';
import { environment } from '../environment';

describe('Fledge gui', () => {
  let skipLogin: SkipLogin;
  let adminLogin: AdminLogin;
  let nonAdminLogin: NonAdminLogin;

  skipLogin = new SkipLogin();
  adminLogin = new AdminLogin();
  nonAdminLogin = new NonAdminLogin();

  beforeEach(() => {
    skipLogin.setUpInstance();
    if (environment.AUTH_OPTIONAL === false) {
      nonAdminLogin.login();
    }
    // required?
    skipLogin.navigateToHome();
  });

  if (environment.AUTH_OPTIONAL === true) {
    it('Should Display Nav Title and App Status',
      {
        retries: {
          // Configure retry attempts for `cypress run`
          // Default is 0
          runMode: 2
        },
      },
      () => {
        skipLogin.navigateToHome();
        skipLogin.getNavTitle().then(title => {
          expect(title.trim()).to.equal('Fledge')
        })
        skipLogin.getAppStatus()
        skipLogin.getReceived().then(received => {
          expect(received.split(':')[0].trim()).to.equal('Received')
        })
        skipLogin.getSent().then(sent => {
          expect(sent.split(':')[0].trim()).to.equal('Sent')
        })
        skipLogin.getUptime().then(uptime => {
          expect(uptime.split(':')[0].trim()).to.equal('Uptime')
        })
      });

    it('Should Display Dashboard', () => {
      skipLogin.navigateToHome();
      skipLogin.isDashboardTimeDropdownPresent()
      skipLogin.isDashboardGraphDropdownPresent()
    });

    // TODO: Test data required to pass below tests.
    // it('Should Display Assets & Readings', () => {
    //   skipLogin.navToAssetReadings();
    //   skipLogin.getAssetTableHeader().then(header => {
    //     expect(header.trim()).to.equal('Asset')
    //   })
    //   skipLogin.getReadingsTableHeader().then(header => {
    //     expect(header.trim()).to.equal('Readings')
    //   })
    //   skipLogin.clickChartIcon();
    //   skipLogin.isChartDisplayed()
    //   skipLogin.closeChartModal();
    // });

    it('Should Display Audits Logs', () => {
      skipLogin.navToAuditLogs();
      skipLogin.getAuditLogsTitle().then(title => {
        expect(title.trim()).to.equal('Audit Logs')
      })
      skipLogin.isAuditLogsSourceDropdownPresent()
      skipLogin.isAuditLogsSeverityDropdownPresent()
    });

    it('Should Display System Logs', () => {
      skipLogin.navToSystemLogs();
      skipLogin.getSystemLogTitle().then(title => {
        expect(title.trim()).to.equal('System Logs')
      })
      skipLogin.isSystemLogDropDownPresent()
      skipLogin.isSystemLogLevelDropdownPresent()
      skipLogin.getSystemLogInputTag()
    });

    it('Should Display Scheduled Tasks', () => {
      skipLogin.navToScheduledTasks();
      skipLogin.getSchedulesTitle().then(title => {
        expect(title.trim()).to.equal('Schedules')
      })
      skipLogin.getSchedulesRefreshButton()
    });

    it('Should Display Certificate Store', () => {
      skipLogin.navToCertificateStore();
      skipLogin.getCertificateStoreTitle().then(title => {
        expect(title.trim()).to.equal('Certificate Store')
      })
      skipLogin.getCertificateStoreRefreshButton()
      skipLogin.getCertificateStoreKeyColKeyName().then(columnName => {
        expect(columnName.trim()).to.equal('Key')
      })
      skipLogin.getCertificateStoreKeyColExtensionName().then(columnName => {
        expect(columnName.trim()).to.equal('Extension')
      })
      skipLogin.getCertificateStoreCertColKeyName().then(columnName => {
        expect(columnName.trim()).to.equal('Certificate')
      })
      skipLogin.getCertificateStoreCertColExtensionName().then(columnName => {
        expect(columnName.trim()).to.equal('Extension')
      })
      skipLogin.getCertificateStoreImport().then(importText => {
        expect(importText.trim()).to.equal('Import')
      })
    });

    it('Should Display Backup & Restore', () => {
      skipLogin.navToBackupRestore();
      skipLogin.getBackupRestoreTitle().then(title => {
        expect(title.trim()).to.equal('Backups')
      })
      skipLogin.noBackupRecord().then(recordText => {
        expect(recordText.trim()).to.equal('No Record')
      })
      skipLogin.getRequestBackup().then(result => {
        expect(result.trim()).to.equal('Create New')
      })
      skipLogin.clickRequestBackup();
      skipLogin.getBackupRestoreColDateName().then(columnName => {
        expect(columnName.trim()).to.equal('Date & Time')
      })
      skipLogin.getBackupRestoreColStatusName().then(columnName => {
        expect(columnName.trim()).to.equal('Status')
      })
      skipLogin.getCreatedBackupRow().then(result => {
        expect(result.trim()).to.equal('COMPLETED')
      })
      skipLogin.deleteBackup();
      skipLogin.noBackupRecord().then(recordText => {
        expect(recordText.trim()).to.equal('No Record')
      })
    });

    it('Should Display Support Bundles', () => {
      skipLogin.navToSupportBundles();
      skipLogin.getSupportBundlesTitle().then(title => {
        expect(title.trim()).to.equal('Support Bundles')
      })
      skipLogin.getSupportBundlesRefreshButton()
      skipLogin.getRequestNewBundle().then(result => {
        expect(result.trim()).to.equal('Request New')
      })
      skipLogin.requestNewBundle().then(result => {
        expect(result.trim()).to.equal('Support bundle created successfully')
      })
    });

    it('Should Display Settings', () => {
      skipLogin.navToSettings();
      skipLogin.getSettingsTitle().then(title => {
        expect(title.trim()).to.equal('Connection Setup')
      })
      skipLogin.getSettingsSelectTag()
      skipLogin.getSettingsHostInputTag()
      skipLogin.getSettingsPortInputTag()
      skipLogin.getSettingsSetUrlAndRestartButton().then(result => {
        expect(result.trim()).to.equal('Set the URL & Restart')
      })
      skipLogin.isRefreshDashboardDropdownPresent()
      skipLogin.isPingIntervalDropdownPresent()
    });
  } else {
    it('Should Display User Management for Admin', () => {
      skipLogin.loginPageInputTag()
      skipLogin.getLoginButton().then(result => {
        expect(result.trim()).to.equal('Log In')
      })
      adminLogin.login();
      adminLogin.isUserManagementPresent()
      adminLogin.navToUserManagement();
      adminLogin.getUserManagementTabName().then(tabName => {
        expect(tabName.trim()).to.equal('User Management')
      })
      adminLogin.getRoleTabName().then(tabName => {
        expect(tabName.trim()).to.equal('Roles')
      })
      adminLogin.isAddUserPresent().then(buttonText => {
        expect(buttonText.trim()).to.equal('Add User')
      })
      const ColumnsName = [
        'Name',
        'Username',
        'Role'
      ];
      for (const ColumnName in ColumnsName) {
        adminLogin.getUserManagementColNames().then(columnName => {
          expect(columnName.trim()).contains(ColumnsName[ColumnName]);
        })
      }
      adminLogin.gotoRoles();
      const RolesColumnsName = [
        'ID',
        'Role'
      ];
      for (const ColumnName in RolesColumnsName) {
        adminLogin.getRolesColNames().then(columnName => {
          expect(columnName.trim()).contains(RolesColumnsName[ColumnName])
        })
      }
    });

    it('Should Display Profile for Admin', () => {
      adminLogin.login();
      adminLogin.navToProfile();
      adminLogin.profileTitle().then(title => {
        expect(title.trim()).to.equal('Profile')
      })
      adminLogin.labelUsername().then(username => {
        expect(username.trim()).to.equal('Username')
      })
      adminLogin.labelRole().then(role => {
        expect(role.trim()).to.equal('Role')
      })
      adminLogin.isChangePassword().then(result => {
        expect(result.trim()).to.equal('Change Password')
      })
      adminLogin.isLogoutActiveSessionButton().then(result => {
        expect(result.trim()).to.equal('Log Out Active Sessions')
      })
      adminLogin.changePassword();
      adminLogin.isInputTag()
      adminLogin.isSaveButton()
      adminLogin.closeModal();
    });

    it('Should Logout Admin and Login non-admin User', () => {
      adminLogin.login();
      adminLogin.logout();
      adminLogin.loginPageInputTag()
      adminLogin.getLoginButton().then(buttonText => {
        expect(buttonText.trim()).to.equal('Log In')
      })
      nonAdminLogin.login();
      nonAdminLogin.getLoggedInUsername().then(user => {
        expect(user.trim()).to.equal('user')
      })
    });

    it('Should Not Display User Management for Non-Admin', () => {
      nonAdminLogin.login();
      nonAdminLogin.isUserManagementPresent()
    });

    it('Should Display Profile for Non-Admin', () => {
      nonAdminLogin.login();
      nonAdminLogin.navToProfile();
      nonAdminLogin.profileTitle().then(title => {
        expect(title.trim()).to.equal('Profile')
      })
      nonAdminLogin.labelUsername().then(username => {
        expect(username.trim()).to.equal('Username')
      })
      nonAdminLogin.labelRole().then(role => {
        expect(role.trim()).to.equal('Role')
      })
      nonAdminLogin.isChangePassword().then(result => {
        expect(result.trim()).to.equal('Change Password')
      })
      nonAdminLogin.isLogoutActiveSessionButton().then(result => {
        expect(result.trim()).to.equal('Log Out Active Sessions')
      })
      nonAdminLogin.changePassword();
      nonAdminLogin.isInputTag()
      nonAdminLogin.isSaveButton()
      nonAdminLogin.closeModal();
    });
  }
});
