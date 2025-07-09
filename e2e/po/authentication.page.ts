import { environment } from '../environment';

export class AuthenticationPage {

    navigateToLogin() {
        return cy.visit('/login');
    }

    navigateToHome() {
        return cy.visit('/');
    }

    setUpInstance() {
        if (environment.HOST === 'localhost' &&
            environment.SERVICE_PORT === '8081') {
            return;
        }
        this.navToSettings()
        cy.get('#protocol-dropdown').click()
        cy.get('#protocol-dropdown #dropdown-menu > div > a:nth-child(1)').click()
        cy.get('#host').clear()
        cy.get('#host').type(environment.HOST)
        cy.get('#service_port').clear()
        cy.get('#service_port').type(environment.SERVICE_PORT)
        cy.get('#set-url-restart-btn').click()
    }

    // Password-based authentication
    loginWithPassword(username: string, password: string) {
        cy.get('app-login form div:nth-child(1) div input[name="username"]').clear().type(username);
        cy.get('app-login form input[name="password"]').clear().type(password);
        cy.wait(1000);
        cy.get('app-login form button.is-link').click();
        // cy.wait(2000);
    }

    // Certificate-based authentication
    openCertificateLoginModal() {
        cy.contains('Login with Certificate').click();
        cy.wait(1000);
    }

    loginWithCertificateFile(certificateFilePath: string) {
        this.openCertificateLoginModal();
        cy.get('#certificate-login-modal input[type="file"]').selectFile(certificateFilePath, { force: true });
        cy.wait(1000);
        cy.get('#certificate-login-modal button[type="submit"]').click();
        cy.wait(2000);
    }

    loginWithCertificateContent(certificateContent: string) {
        this.openCertificateLoginModal();
        // Switch to manual certificate input
        cy.get('#certificate-login-modal .button.is-text').click();
        cy.wait(500);
        cy.get('#certificate-login-modal textarea[formControlName="certificateText"]').clear().type(certificateContent);
        cy.wait(1000);
        cy.get('#certificate-login-modal button[type="submit"]').click();
        cy.wait(2000);
    }

    closeCertificateModal() {
        cy.get('#certificate-login-modal .delete').click();
    }

    // Flexible authentication (any method)
    loginWithAnyMethod(method: 'password' | 'certificate', credentials: any) {
        if (method === 'password') {
            this.loginWithPassword(credentials.username, credentials.password);
        } else if (method === 'certificate') {
            if (credentials.filePath) {
                this.loginWithCertificateFile(credentials.filePath);
            } else if (credentials.content) {
                this.loginWithCertificateContent(credentials.content);
            }
        }
    }

    // Authentication validation methods
    verifyLoginSuccess() {
        // Check if redirected to dashboard and user is logged in
        cy.url().should('not.include', '/login');
        cy.get('#dropdown-box').should('be.visible');
        cy.wait(1000);
    }

    verifyLoginFailure(expectedErrorMessage?: string) {
        // Should still be on login page
        cy.url().should('include', '/login');

        if (expectedErrorMessage) {
            cy.get('.alert, .notification, .message').should('contain', expectedErrorMessage);
        }
    }

    getLoggedInUsername() {
        return cy.get('#dropdown-box').invoke('text').then(text => text.trim());
    }

    getUserRole() {
        this.openUserDropdown();
        cy.get('#dropdown-menu > div > a.user-content:nth-child(1)').click({ force: true });
        cy.wait(1000);
        return cy.get("#edit_profile > div:nth-child(3) input[name='role']").invoke('val');
    }

    openUserDropdown() {
        cy.get('#dropdown-box').invoke('mouseenter');
        cy.get('#dropdown-menu').invoke('show');
    }

    logout() {
        cy.wait(1000);
        this.openUserDropdown();
        cy.get('#dropdown-menu > div > a.user-content:nth-child(2)').click({ force: true });
        cy.wait(1000);
    }

    // Error handling methods
    getErrorMessage() {
        return cy.get('.alert, .notification, .message, .help.is-danger').invoke('text');
    }

    clearErrorMessage() {
        cy.get('.alert .delete, .notification .delete').click({ multiple: true });
    }

    // Authentication state checks
    isAuthenticationRequired() {
        return cy.window().then((win) => {
            const authSkipped = win.sessionStorage.getItem('LOGIN_SKIPPED');
            return authSkipped !== 'true';
        });
    }

    isUserLoggedIn() {
        return cy.window().then((win) => {
            const token = win.sessionStorage.getItem('token');
            return token !== null && token.length > 0;
        });
    }

    navToSettings() {
        return cy.visit('/#/setting');
    }

    // Test data setup methods
    clearAuthenticationData() {
        cy.window().then((win) => {
            win.sessionStorage.removeItem('token');
            win.sessionStorage.removeItem('userName');
            win.sessionStorage.removeItem('roleId');
            win.sessionStorage.removeItem('LOGIN_SKIPPED');
        });
    }

    // Validation helpers
    validatePasswordField() {
        cy.get('app-login form input[name="password"]').should('be.visible');
        cy.get('app-login form input[name="password"]').should('have.attr', 'type', 'password');
    }

    validateUsernameField() {
        cy.get('app-login form input[name="username"]').should('be.visible');
        cy.get('app-login form input[name="username"]').should('have.attr', 'type', 'text');
    }

    validateLoginButton() {
        cy.get('app-login form button.is-link').should('be.visible');
        cy.get('app-login form button.is-link').should('contain', 'Log In');
    }

    validateCertificateLoginLink() {
        cy.contains('Login with Certificate').should('be.visible');
    }

    // Form validation
    submitEmptyLoginForm() {
        cy.get('app-login form button.is-link').click();
        cy.wait(500);
    }

    validateRequiredFieldErrors() {
        cy.get('.help.is-danger').should('contain', 'Username is required');
        cy.get('.help.is-danger').should('contain', 'Password is required');
    }

    // Navigation helpers
    isOnLoginPage() {
        return cy.url().should('include', '/login');
    }

    isOnDashboard() {
        return cy.url().should('not.include', '/login');
    }

    // Authentication method detection
    detectAvailableAuthMethods() {
        const methods = [];

        // Check for password authentication
        cy.get('app-login form input[name="username"]').then(($username) => {
            if ($username.length > 0) {
                methods.push('password');
            }
        });

        // Check for certificate authentication
        cy.get('body').then(($body) => {
            if ($body.find('a:contains("Login with Certificate")').length > 0) {
                methods.push('certificate');
            }
        });

        return cy.wrap(methods);
    }

    // Advanced authentication scenarios
    attemptBruteForceProtection(username: string, maxAttempts: number = 5) {
        for (let i = 0; i < maxAttempts; i++) {
            this.loginWithPassword(username, 'wrongpassword');
            cy.wait(1000);
        }
    }

    // Certificate validation helpers
    validateCertificateModal() {
        cy.get('#certificate-login-modal').should('be.visible');
        cy.get('#certificate-login-modal .modal-card-title').should('contain', 'Login with Certificate');
        // cy.get('#certificate-login-modal input[type="file"]').should('be.visible');
        cy.get('#certificate-login-modal textarea').should('be.visible');
    }

    // Create test certificate content (for testing purposes)
    getTestCertificateContent() {
        return `-----BEGIN CERTIFICATE-----
            MIICdTCCAV0CAQAwDQYJKoZIhvcNAQEFBQAwEjEQMA4GA1UEAwwHZmxlZGdlMDAe
            Fw0yMzEyMjkxMjAwMDBaFw0yNDEyMjkxMjAwMDBaMBIxEDAOBgNVBAMMB2ZsZWRn
            ZTAwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC5/example/certificate
            content/for/testing/purposes/only/this/is/not/a/real/certificate/just/for/demo
            -----END CERTIFICATE-----`;
    }

    // Multi-factor authentication simulation
    simulateMFA(username: string, password: string, mfaCode: string) {
        this.loginWithPassword(username, password);

        // Check if MFA is required
        cy.get('body').then(($body) => {
            if ($body.find('input[name="mfaCode"]').length > 0) {
                cy.get('input[name="mfaCode"]').type(mfaCode);
                cy.get('button[type="submit"]').click();
                cy.wait(1000);
            }
        });
    }
} 