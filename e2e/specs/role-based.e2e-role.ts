import { RoleBasedPage } from '../po/role-based.page';
import { SkipLogin } from '../po/app.skip';

describe('Role-Based E2E Tests with Setup', () => {
    let roleBasedPage: RoleBasedPage;
    let skipLogin: SkipLogin;

    // Define base usernames and generate timestamp versions
    const baseUsernames = ['viewer', 'dataviewer', 'control'];
    const timestamp = Date.now();
    const testUsers = baseUsernames.map(username => `${username}_${timestamp}`);

    // Helper function to create user with dynamic username
    const createUser = (username: string, realName: string, role: string, description: string) => {
        cy.get('app-user-management header li.action-items div:nth-child(2) button').click();
        cy.wait(1000);

        cy.get('#user_modal input[name="real_name"]').clear().type(realName);
        cy.get('#user_modal input[name="username"]').clear().type(username);
        cy.get('#user_modal input[name="password"]').clear().type('fledge');
        cy.get('#user_modal input[name="confirmPassword"]').clear().type('fledge');
        cy.get('#user_modal textarea[name="description"]').clear().type(description);

        cy.get('#user_modal #create-user-dropdown').click();
        cy.get(`#user_modal .dropdown-content .dropdown-item[data-role-name="${role}"]`).click();

        cy.get('#user_modal #save').click();
        cy.wait(2000);

        // Verify user was created
        cy.get('app-user-management table tbody').should('contain', username);
        cy.log(`User ${username} created successfully`);
    };

    beforeEach(() => {
        roleBasedPage = new RoleBasedPage();
        skipLogin = new SkipLogin();
        skipLogin.setUpInstance();
        skipLogin.navigateToHome();
    });

    // ============================================================================
    // TEST DATA SETUP - Runs First
    // ============================================================================
    describe('Test Data Setup for Role-Based Tests', () => {
        beforeEach(() => {
            roleBasedPage.loginUser('admin');
            cy.wait(2000);
            roleBasedPage.isUserManagementAccessible();
        });

        it('Should create test users for all roles', () => {
            // Navigate to user management
            roleBasedPage.navToUserManagement();
            cy.wait(2000);

            // Create Viewer user
            createUser(testUsers[0], 'Test Viewer User', 'Viewer', 'Test user for Viewer role');

            // Create Data Viewer user
            createUser(testUsers[1], 'Test Data Viewer User', 'Data Viewer', 'Test user for Data Viewer role');

            // Create Control user
            createUser(testUsers[2], 'Test Control User', 'Control', 'Test user for Control role');

            // Verify users were created
            cy.get('app-user-management table tbody tr').should('have.length.at.least', 4);
            cy.get('app-user-management table tbody').should('contain', testUsers[0]);
            cy.get('app-user-management table tbody').should('contain', testUsers[1]);
            cy.get('app-user-management table tbody').should('contain', testUsers[2]);
        });

        afterEach(() => {
            roleBasedPage.logout();
        });
    });

    // ============================================================================
    // ROLE-BASED ACCESS CONTROL TESTS - Runs After Setup
    // ============================================================================
    describe('Role-Based Access Control Tests', () => {
        describe('Administrator Role Tests', () => {
            beforeEach(() => {
                roleBasedPage.loginUser('admin');
                cy.wait(2000);
            });

            it('Should login as Administrator and verify role', () => {
                roleBasedPage.getLoggedInUsername().then(username => {
                    expect(username.trim()).to.equal('admin');
                });

                roleBasedPage.getUserRole().then(role => {
                    expect(role).to.equal('Administrator');
                });
            });

            it('Should have editable configuration', () => {
                roleBasedPage.isConfigurationEditable();
            });

            it('Should be able to access User Management', () => {
                roleBasedPage.isUserManagementAccessible();
                roleBasedPage.navToUserManagement();
                roleBasedPage.isAddUserButtonPresent();
            });

            it('Should be able to access Control Pipeline', () => {
                roleBasedPage.isControlPipelineAccessible();
            });

            it('Should be able to access Backup & Restore', () => {
                roleBasedPage.isBackupRestoreAccessible();
            });

            it('Should be able to access Support Bundles', () => {
                roleBasedPage.isSupportBundlesAccessible();
            });

            it('Should have editable settings', () => {
                roleBasedPage.isSettingsEditable();
            });

            afterEach(() => {
                roleBasedPage.logout();
            });
        });

        describe('Editor Role Tests', () => {
            beforeEach(() => {
                roleBasedPage.loginUser('user');
                cy.wait(2000);
            });

            it('Should login as Editor and verify role', () => {
                roleBasedPage.getLoggedInUsername().then(username => {
                    expect(username.trim()).to.equal('user');
                });

                roleBasedPage.getUserRole().then(role => {
                    expect(role).to.equal('Editor');
                });
            });

            it('Should have access to Audit Logs', () => {
                roleBasedPage.isAuditLogsAccessible();
            });

            it('Should have access to System Logs', () => {
                roleBasedPage.isSystemLogsAccessible();
            });

            it('Should have access to Scheduled Tasks', () => {
                roleBasedPage.isSchedulesTabAccessible();
            });

            it('Should have access to Certificate Store', () => {
                roleBasedPage.isCertificateStoreAccessible();
            });

            it('Should have access to Control Pipeline', () => {
                roleBasedPage.isControlPipelineAccessible();
            });

            it('Should NOT have access to User Management', () => {
                roleBasedPage.isUserManagementNotAccessible();
            });

            it('Should NOT have access to Backup & Restore', () => {
                roleBasedPage.isBackupRestoreNotAccessible();
            });

            it('Should NOT have access to Support Bundles', () => {
                roleBasedPage.isSupportBundlesNotAccessible();
            });

            it('Should have disabled Admin and User REST API configuration', () => {
                roleBasedPage.isConfigurationReadOnly();
            });

            it('Should NOT able to Add Control Script', () => {
                roleBasedPage.isControlScriptsAddButtonNotPresent();
            });

            it('Should NOT able to Add Control Pipeline', () => {
                roleBasedPage.isControlPipelinesAddButtonNotPresent();
            });

            afterEach(() => {
                roleBasedPage.logout();
            });
        });

        describe('Viewer Role Tests', () => {
            beforeEach(() => {
                roleBasedPage.loginUser(testUsers[0]);
                cy.wait(2000);
            });

            it('Should login as Viewer and verify role', () => {
                roleBasedPage.getLoggedInUsername().then(username => {
                    expect(username.trim()).to.equal(testUsers[0]);
                });

                roleBasedPage.getUserRole().then(role => {
                    expect(role).to.equal('Viewer');
                });
            });

            it('Should have read-only configuration', () => {
                roleBasedPage.isConfigurationReadOnly();
            });

            it('Should NOT have access to User Management', () => {
                roleBasedPage.isUserManagementNotAccessible();
            });

            it('Should NOT have access to Backup & Restore', () => {
                roleBasedPage.isBackupRestoreNotAccessible();
            });

            it('Should NOT have access to Support Bundles', () => {
                roleBasedPage.isSupportBundlesNotAccessible();
            });

            it('Should NOT able to Add South Service', () => {
                roleBasedPage.isSouthAddButtonNotPresent();
            });

            it('Should NOT able to Add North Service/Task', () => {
                roleBasedPage.isNorthAddButtonNotPresent();
            });

            it('Should NOT able to Edit any Schedule', () => {
                roleBasedPage.isScheduleViewLinkPresent();
            });

            afterEach(() => {
                roleBasedPage.logout();
            });
        });

        describe('Data Viewer Role Tests', () => {
            beforeEach(() => {
                roleBasedPage.loginUser(testUsers[1]);
                cy.wait(2000);
            });

            it('Should login as Data Viewer and verify role', () => {
                roleBasedPage.getLoggedInUsername().then(username => {
                    expect(username.trim()).to.equal(testUsers[1]);
                });

                roleBasedPage.getUserRole().then(role => {
                    expect(role).to.equal('Data Viewer');
                });
            });

            it('Should have access to Dashboard, Readings, and Settings tabs', () => {
                roleBasedPage.isDataViewerTabsAccessible();
            });

            it('Should have another sidebar tabs hidden', () => {
                roleBasedPage.areSidebarActionsHiddenForDataViewer();
            });

            afterEach(() => {
                roleBasedPage.logout();
            });
        });

        describe('Control Role Tests', () => {
            beforeEach(() => {
                roleBasedPage.loginUser(testUsers[2]);
                cy.wait(2000);
            });

            it('Should login as Control and verify role', () => {
                roleBasedPage.getLoggedInUsername().then(username => {
                    expect(username.trim()).to.equal(testUsers[2]);
                });

                roleBasedPage.getUserRole().then(role => {
                    expect(role).to.equal('Control');
                });
            });

            it('Should able to Add Control Script', () => {
                roleBasedPage.isControlScriptsAddButtonPresent();
            });

            it('Should able to Add Control Pipeline', () => {
                roleBasedPage.isControlPipelinesAddButtonPresent();
            });

            it('Should have access to Audit Logs', () => {
                roleBasedPage.isAuditLogsAccessible();
            });

            it('Should have access to System Logs', () => {
                roleBasedPage.isSystemLogsAccessible();
            });

            it('Should have access to Schedules', () => {
                roleBasedPage.isSchedulesTabAccessible();
            });

            it('Should have access to Certificate Store', () => {
                roleBasedPage.isCertificateStoreAccessible();
            });

            it('Should NOT have access to User Management', () => {
                roleBasedPage.isUserManagementNotAccessible();
            });

            it('Should have access to Control Pipeline', () => {
                roleBasedPage.isControlPipelineAccessible();
            });

            it('Should NOT have access to Backup & Restore', () => {
                roleBasedPage.isBackupRestoreNotAccessible();
            });

            it('Should NOT have access to Support Bundles', () => {
                roleBasedPage.isSupportBundlesNotAccessible();
            });

            it('Should have disabled Admin and User REST API configuration', () => {
                roleBasedPage.isConfigurationReadOnly();
            });

            afterEach(() => {
                roleBasedPage.logout();
            });
        });
    });

    // ============================================================================
    // CLEANUP - Runs After All Tests
    // ============================================================================
    after(() => {
        // Login as admin for cleanup
        roleBasedPage.loginUser('admin');
        cy.wait(2000);

        // Navigate to user management
        roleBasedPage.navToUserManagement();
        roleBasedPage.isUserManagementAccessible();
        cy.wait(2000);

        // Delete each test user
        testUsers.forEach(username => {
            cy.get('app-user-management table tbody tr').each(($row) => {
                const rowUsername = $row.find('td:nth-child(3)').text().trim();
                if (rowUsername === username) {
                    cy.wrap($row).find('td:nth-child(8) > div > div.dropdown-trigger > a').click();
                    cy.wait(500);

                    // Find and click the delete button for this user
                    cy.wrap($row).find('div.dropdown-menu > div > a:nth-child(4)').click();
                    cy.wait(1000);

                    // Confirm deletion if there's a confirmation dialog
                    cy.get('body').then(($body) => {
                        if ($body.find('.modal.is-active, .confirmation-dialog').length > 0) {
                            cy.get('#modal-box > .modal-card > footer > .is-warning').click();
                        }
                    });
                    cy.wait(1000);
                }
            });
        });

        // Verify cleanup
        cy.get('app-user-management table tbody').should('not.contain', testUsers[0]);
        cy.get('app-user-management table tbody').should('not.contain', testUsers[1]);
        cy.get('app-user-management table tbody').should('not.contain', testUsers[2]);

        roleBasedPage.logout();
    });
});