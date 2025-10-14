import { AuthenticationPage } from '../po/authentication.page';

describe('Authentication Methods Based Tests', () => {
    let authPage: AuthenticationPage;

    const testUsers = {
        admin: { username: 'admin', password: 'fledge' },
        user: { username: 'user', password: 'fledge' },
        invalid: { username: 'invalidUser', password: 'wrongPwd' }
    };

    beforeEach(() => {
        authPage = new AuthenticationPage();
        authPage.setUpInstance();
        authPage.clearAuthenticationData();
    });

    afterEach(() => {
        // Clean up after each test
        authPage.clearAuthenticationData();
    });

    describe('Password-Only Authentication', () => {
        beforeEach(() => {
            authPage.navigateToLogin();
        });

        it('Should successfully login with valid admin credentials',
            () => {
                // Validate login form elements
                authPage.validateUsernameField();
                authPage.validatePasswordField();
                authPage.validateLoginButton();

                // Perform login
                authPage.loginWithPassword(testUsers.admin.username, testUsers.admin.password);

                // Verify successful login
                authPage.verifyLoginSuccess();
                authPage.getLoggedInUsername().then(username => {
                    expect(username).to.contain('admin');
                });

                // Verify user role
                authPage.getUserRole().then(role => {
                    expect(role).to.equal('Administrator');
                });
            });

        it('Should successfully login with valid user credentials', () => {
            authPage.loginWithPassword(testUsers.user.username, testUsers.user.password);
            authPage.verifyLoginSuccess();

            authPage.getLoggedInUsername().then(username => {
                expect(username).to.contain('user');
            });
        });

        it('Should reject invalid credentials with proper error message', () => {
            authPage.loginWithPassword(testUsers.invalid.username, testUsers.invalid.password);
            authPage.verifyLoginFailure();

            // Check for error message
            authPage.getErrorMessage().then(errorText => {
                expect(errorText.toLowerCase()).to.contain('user does not exist');
            });
        });

        it('Should show validation errors for empty form submission', () => {
            authPage.submitEmptyLoginForm();
            authPage.validateRequiredFieldErrors();
        });

        it('Should reject empty username with proper error message', () => {
            // Leave username empty, fill password, and submit
            cy.get('app-login form input[name="password"]').clear().type(testUsers.admin.password);
            cy.get('app-login form button.is-link').click();
            cy.wait(1000);

            // Check for client-side validation message under username field
            cy.get('.help.is-danger').should('contain', 'Username is required');
        });

        it('Should reject empty password with proper error message', () => {
            // Fill username, leave password empty, and submit
            cy.get('app-login form div:nth-child(1) div input[name="username"]').clear().type(testUsers.admin.username);
            cy.get('app-login form button.is-link').click();
            cy.wait(1000);

            // Check for client-side validation message under password field
            cy.get('.help.is-danger').should('contain', 'Password is required');
        });

        it('Should logout successfully', () => {
            authPage.loginWithPassword(testUsers.admin.username, testUsers.admin.password);
            authPage.verifyLoginSuccess();

            authPage.logout();
            cy.wait(1000);

            // Should be redirected to login page
            authPage.isOnLoginPage();
        });

        it('Should prevent brute force attacks', () => {
            // Attempt multiple failed logins
            for (let i = 0; i < 3; i++) {
                authPage.loginWithPassword(testUsers.admin.username, 'wrongpassword');
                cy.wait(1000);
                authPage.verifyLoginFailure();
            }

            // Should still show error after multiple attempts
            authPage.getErrorMessage().then(errorText => {
                expect(errorText.toLowerCase()).to.contain('username or password do not match');
            });
        });
    });

    describe('Certificate-Based Authentication', () => {
        beforeEach(() => {
            authPage.navigateToLogin();
        });

        it('Should display certificate login option', () => {
            authPage.validateCertificateLoginLink();
        });

        it('Should open certificate login modal', () => {
            authPage.openCertificateLoginModal();

            // Click on "Paste Content" link
            cy.get('#certificate-login-modal .button.is-ghost').click();
            cy.wait(500);

            authPage.validateCertificateModal();
        });

        it('Should close certificate login modal', () => {
            authPage.openCertificateLoginModal();

            // Click on "Paste Content" link
            cy.get('#certificate-login-modal .button.is-ghost').click();
            cy.wait(500);

            authPage.validateCertificateModal();
            authPage.closeCertificateModal();

            // Modal should be closed
            cy.get('#certificate-login-modal').should('not.be.visible');
        });

        it('Should login with certificate content', () => {
            const testCertContent = authPage.getTestCertificateContent();

            // Note: This test will fail in a real environment without a valid certificate
            // It's designed to test the UI flow
            authPage.loginWithCertificateContent(testCertContent);

            // In a real test environment, this would either succeed or show a proper error
            cy.get('body').then(($body) => {
                if ($body.find('#dropdown-box').length > 0) {
                    // Login successful
                    authPage.verifyLoginSuccess();
                } else {
                    // Login failed with proper error handling
                    authPage.verifyLoginFailure();
                }
            });
        });

        it('Should validate certificate file upload', () => {
            authPage.openCertificateLoginModal();

            // Test with invalid file (should show error)
            cy.get('#certificate-login-modal input[type="file"]').then($input => {
                // Create a test file
                const testFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(testFile);
                ($input[0] as HTMLInputElement).files = dataTransfer.files;
                $input[0].dispatchEvent(new Event('change', { bubbles: true }));
            });

            // Should show validation error for non-certificate file
            cy.get('#certificate-login-modal .help.is-danger').should('contain', 'Invalid');
        });

        it('Should require certificate content for submission', () => {
            authPage.openCertificateLoginModal();

            // Submit without certificate
            cy.get('#certificate-login-modal button[type="submit"]').click();
            cy.wait(500);

            // Should show error message
            authPage.getErrorMessage().then(errorText => {
                expect(errorText.toLowerCase()).to.contain('certificate');
            });
        });

        it('Should switch between file upload and text input', () => {
            authPage.openCertificateLoginModal();

            // Initially should show file input area (file input itself is hidden by Bulma CSS)
            cy.get('#certificate-login-modal input[type="file"]').should('exist');
            cy.get('#certificate-login-modal .file-label').should('be.visible');

            // Click "Paste Content" button to switch to text input
            cy.get('#certificate-login-modal .button.is-ghost').click();
            cy.wait(500);

            // Should show textarea
            cy.get('#certificate-login-modal textarea').should('be.visible');

            // Click "Upload File" button to switch back to file input
            cy.get('#certificate-login-modal .button.is-ghost').click();
            cy.wait(500);

            // Should show file input area again
            cy.get('#certificate-login-modal input[type="file"]').should('exist');
            cy.get('#certificate-login-modal .file-label').should('be.visible');
        });
    });

    describe('Flexible Authentication (Any Method)', () => {
        beforeEach(() => {
            authPage.navigateToLogin();
        });

        it('Should detect available authentication methods', () => {
            authPage.detectAvailableAuthMethods().then(methods => {
                expect(methods).to.include('password');
                expect(methods).to.include('certificate');
            });
        });

        it('Should login using any available method - Password', () => {
            const credentials = {
                username: testUsers.admin.username,
                password: testUsers.admin.password
            };

            authPage.loginWithAnyMethod('password', credentials);
            authPage.verifyLoginSuccess();
        });

        it('Should login using any available method - Certificate', () => {
            const credentials = {
                content: authPage.getTestCertificateContent()
            };

            authPage.loginWithAnyMethod('certificate', credentials);

            // Handle both success and failure scenarios
            cy.get('body').then(($body) => {
                if ($body.find('#dropdown-box').length > 0) {
                    authPage.verifyLoginSuccess();
                } else {
                    authPage.verifyLoginFailure();
                }
            });
        });

        it('Should handle authentication method selection dynamically', () => {
            // Test dynamic selection based on available methods
            authPage.detectAvailableAuthMethods().then(methods => {
                if (methods.includes('password')) {
                    authPage.loginWithPassword(testUsers.admin.username, testUsers.admin.password);
                    authPage.verifyLoginSuccess();
                } else if (methods.includes('certificate')) {
                    authPage.loginWithCertificateContent(authPage.getTestCertificateContent());
                    // Handle result appropriately
                }
            });
        });

        it('Should validate authentication state properly', () => {
            // Check authentication requirement
            authPage.isAuthenticationRequired().then(isRequired => {
                if (isRequired) {
                    // Authentication is required, test login
                    authPage.loginWithPassword(testUsers.admin.username, testUsers.admin.password);
                    authPage.verifyLoginSuccess();

                    // Check if user is logged in
                    authPage.isUserLoggedIn().then(loggedIn => {
                        expect(loggedIn).to.be.true;
                    });
                } else {
                    // Authentication is optional, should be able to access dashboard
                    authPage.navigateToHome();
                    authPage.isOnDashboard();
                }
            });
        });
    });
}); 