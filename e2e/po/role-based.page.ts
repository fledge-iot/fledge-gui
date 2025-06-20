export class RoleBasedPage {
    // Login with specific role
    loginUser(user) {
        cy.get('app-login form div:nth-child(1) div input[name="username"]').type(user)
        cy.get('app-login form input[name="password"]').type('fledge')
        cy.wait(1000)
        cy.get('app-login form button.is-link').click();
    }

    // Get logged in username
    getLoggedInUsername() {
        return cy.get('#dropdown-box .navbar-link b').invoke('text');
    }

    // Get user role from profile
    getUserRole() {
        this.navToProfile();
        return cy.get("#edit_profile > div:nth-child(3) input[name='role']").invoke('val');
    }

    // Navigate to profile
    navToProfile() {
        cy.get('#dropdown-box').invoke('mouseenter');
        cy.get('#dropdown-menu').invoke('show');
        cy.get('#dropdown-menu > div > a.user-content:nth-child(1)').click({ force: true });
        cy.wait(2000);
    }

    // Check if user management is accessible
    isUserManagementAccessible() {
        cy.wait(2000);
        return cy.get('#user-management').should('be.visible');
    }

    // Check if user management is NOT accessible
    isUserManagementNotAccessible() {
        cy.wait(2000);
        cy.get('aside .menu-list').should('be.visible');
        return cy.get('#user-management').should('not.exist');
    }

    // Navigate to user management
    navToUserManagement() {
        return cy.visit('/#/user-management');
    }

    // Check if add user button is present
    isAddUserButtonPresent() {
        return cy.get('app-user-management header li.action-items div:nth-child(2) button').should('be.visible');
    }

    // Check if add user button is NOT present
    isAddUserButtonNotPresent() {
        return cy.get('app-user-management header li.action-items div:nth-child(2) button').should('not.exist');
    }

    // Check if Control Scripts Add button is present
    isControlScriptsAddButtonPresent() {
        cy.visit('/#/control-dispatcher/script');
        cy.wait(2000);
        return cy.get('app-control-scripts-list .add-btn').should('be.visible');
    }

    // Check if Control Scripts Add button is NOT present
    isControlScriptsAddButtonNotPresent() {
        cy.visit('/#/control-dispatcher/script');
        cy.wait(2000);
        return cy.get('app-control-scripts-list .add-btn').should('not.exist');
    }

    // Check if Control Pipelines Add button is present
    isControlPipelinesAddButtonPresent() {
        cy.visit('/#/control-dispatcher/pipelines');
        cy.wait(2000);
        return cy.get('app-control-pipelines .add-btn').should('be.visible');
    }

    // Check if Control Pipelines Add button is NOT present
    isControlPipelinesAddButtonNotPresent() {
        cy.visit('/#/control-dispatcher/pipelines');
        cy.wait(2000);
        return cy.get('app-control-pipelines .add-btn').should('not.exist');
    }

    // Check if settings are editable
    isSettingsEditable() {
        cy.visit('/#/settings');
        cy.wait(2000);
        return cy.get('input[type="checkbox"]').should('not.be.disabled');
    }

    // Check if settings are read-only (Viewer, Data Viewer roles)
    isSettingsReadOnly() {
        cy.visit('/#/settings');
        cy.wait(2000);
        return cy.get('input[type="checkbox"]').should('be.disabled');
    }

    // Check if control pipeline is accessible
    isControlPipelineAccessible() {
        cy.visit('/#/control-dispatcher/pipelines');
        cy.wait(2000);
        return cy.get('app-control-pipelines').should('be.visible');
    }

    // Check if control pipeline is NOT accessible
    isControlPipelineNotAccessible() {
        cy.visit('/#/control-dispatcher/pipelines');
        cy.wait(2000);
        return cy.get('app-control-pipelines').should('not.exist');
    }

    // Check if data viewer specific features are accessible
    isDataViewerFeaturesAccessible() {
        cy.visit('/#/asset');
        cy.wait(4000);
        return cy.get('app-asset-readings').should('be.visible');
    }

    // Check if Data Viewer has access to specific tabs
    isDataViewerTabsAccessible() {
        // Check Dashboard tab
        cy.visit('/#/');
        cy.wait(2000);
        cy.get('app-dashboard').should('be.visible');

        // Check Readings tab
        cy.visit('/#/asset');
        cy.wait(2000);
        cy.get('app-assets').should('be.visible');

        // Check Settings tab
        cy.visit('/#/setting');
        cy.wait(2000);
        cy.get('app-settings').should('be.visible');

        return cy.get('app-settings').should('be.visible');
    }

    // Check if sidebar action items are hidden for Data Viewer
    areSidebarActionsHiddenForDataViewer() {
        cy.wait(4000);
        return cy.get('aside .menu-list a[requiredViewEditorRole]').should('not.exist');
    }

    // Check if backup/restore is accessible
    isBackupRestoreAccessible() {
        cy.visit('/#/backup-restore');
        cy.wait(2000);
        return cy.get('app-backup-restore').should('be.visible');
    }

    // Check if backup/restore is NOT accessible
    isBackupRestoreNotAccessible() {
        cy.visit('/#/backup-restore');
        cy.wait(2000);
        return cy.get('app-backup-restore').should('not.exist');
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

    navToBackupRestore() {
        return cy.visit('/#/backup-restore');
    }

    getBackupRestoreTitle() {
        return cy.get('.card-header-title').invoke('text')
    }

    noBackupRecord() {
        return cy.get('app-backup-restore .no-rec').invoke('text')
    }

    getRequestBackup() {
        cy.get('app-backup-restore .dropdown.is-hoverable.is-right').invoke('mouseenter')
        cy.get('#dropdown-menu3').invoke('show')
        return cy.get('#dropdown-menu3 .dropdown-content #create-backup span').invoke('text')
    }

    // Check if support bundles are accessible
    isSupportBundlesAccessible() {
        cy.visit('/#/support');
        cy.wait(2000);
        return cy.get('app-support').should('be.visible');
    }

    // Check if support bundles are NOT accessible
    isSupportBundlesNotAccessible() {
        cy.visit('/#/support');
        cy.wait(2000);
        return cy.get('app-support').should('not.exist');
    }

    // Check if configuration editing is allowed
    isConfigurationEditable() {
        cy.visit('/#/configuration');
        cy.wait(2000);
        return cy.get('#httpPort').should('not.be.disabled');
    }

    // Check if configuration is read-only
    isConfigurationReadOnly() {
        cy.visit('/#/configuration');
        cy.wait(2000);

        // Wait for the configuration page to load
        cy.get('app-configuration-manager').should('be.visible');
        return cy.get('#config-manager app-static-configuration:nth-child(3) .field-body > div > span').should('be.visible');
    }

    // Check if audit logs are accessible
    isAuditLogsAccessible() {
        cy.visit('/#/logs/audit');
        cy.wait(2000);
        return cy.get('app-audit-log').should('be.visible');
    }

    // Check if system logs are accessible
    isSystemLogsAccessible() {
        cy.visit('/#/logs/syslog');
        cy.wait(2000);
        return cy.get('app-system-log').should('be.visible');
    }

    isSchedulesTabAccessible() {
        cy.visit('/#/schedules');
        cy.wait(2000);
        return cy.get('app-list-schedules').should('be.visible');
    }

    isCertificateStoreAccessible() {
        cy.visit('/#/certificate');
        cy.wait(2000);
        return cy.get('app-cert-store').should('be.visible');
    }

    // Check if South page Add button is NOT present
    isSouthAddButtonNotPresent() {
        cy.visit('/#/south');
        cy.wait(2000);
        return cy.get('app-south .add-btn, app-south button[title*="Add"], app-south .button.is-info').should('not.exist');
    }

    // Check if North page Add button is NOT present
    isNorthAddButtonNotPresent() {
        cy.visit('/#/north');
        cy.wait(2000);
        return cy.get('app-north .add-btn, app-north button[title*="Add"], app-north .button.is-info').should('not.exist');
    }

    // Check if Schedule page view link is present
    isScheduleViewLinkPresent() {
        cy.visit('/#/schedules');
        cy.wait(2000);
        cy.get('app-list-schedules #purge').trigger('mouseover');
        return cy.get('app-list-schedules #purge > td:nth-child(5) > div > a:contains("view")').should('be.exist');
    }

    // Check if South page Add button is present
    isSouthAddButtonPresent() {
        cy.visit('/#/south');
        cy.wait(2000);
        return cy.get('app-south .add-btn, app-south button[title*="Add"], app-south .button.is-info').should('be.visible');
    }

    // Check if North page Add button is present
    isNorthAddButtonPresent() {
        cy.visit('/#/north');
        cy.wait(2000);
        return cy.get('app-north .add-btn, app-north button[title*="Add"], app-north .button.is-info').should('be.visible');
    }

    // Logout
    logout() {
        cy.wait(2000);
        cy.get('#dropdown-box').invoke('mouseenter');
        cy.get('#dropdown-menu').invoke('show');
        cy.get('#dropdown-menu > div > a.user-content:nth-child(2)').click({ force: true });
        cy.wait(1000);
    }
} 