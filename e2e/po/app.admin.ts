export class AdminLogin {

  login() {
    cy.get('app-login form div:nth-child(1) div input[name="username"]').type('admin')
    cy.get('app-login form input[name="password"]').type('fledge')
    cy.wait(1000)
    cy.get('app-login form button.is-info').click()
  }

  isUserManagementPresent() {
    cy.wait(2000)
    cy.get('#user-management').should('be.visible')
  }

  navToUserManagement() {
    return cy.visit('/#/user-management')
  }

  getUserManagementTabName() {
    return cy.get('app-user-management header .tabs ul li:nth-child(1)').invoke('text')
  }

  getRoleTabName() {
    return cy.get('app-user-management header .tabs ul li:nth-child(2)').invoke('text')
  }

  isAddUserPresent() {
    return cy.get('app-user-management .add-btn').invoke('text')
  }

  getUserManagementColNames() {
    return cy.get('#head').invoke('text')
  }

  gotoRoles() {
    cy.get('app-user-management header .tabs ul li:nth-child(2)').click()
  }

  getRolesColNames() {
    return cy.get('app-user-management table thead').invoke('text')
  }

  navToProfile() {
    cy.get('#dropdown-box').invoke('mouseenter')
    cy.get('#dropdown-menu').invoke('show')
    cy.get('#dropdown-menu > div > a.user-content:nth-child(1)').click({ force: true })
    cy.wait(2000)
  }

  profileTitle() {
    return cy.get('.card .card-header-title').invoke('text')
  }

  labelUsername() {
    return cy.get('#edit_profile > div:nth-child(2) > div > label').invoke('text')
  }

  labelRole() {
    return cy.get('#edit_profile > div:nth-child(3) > div > label').invoke('text')
  }

  isChangePassword() {
    return cy.get('#edit_profile > div:nth-child(5) > div > a:nth-child(1)').invoke('text')
  }

  isLogoutActiveSessionButton() {
    return cy.get('#edit_profile > div:nth-child(5) > div > a:nth-child(2)').invoke('text')
  }

  changePassword() {
    cy.get('#edit_profile > div:nth-child(5) > div > a:nth-child(1)').click()
  }

  getInputTagCount() {
    return cy.get('#ngForm input').should('be.visible')
  }

  isSaveButton() {
    return cy.get('#update').should('be.visible')
  }

  closeModal() {
    cy.get('#user_profile_modal .delete').click()
  }

  logout() {
    cy.wait(2000)
    cy.get('#dropdown-box').invoke('mouseenter')
    cy.get('#dropdown-menu').invoke('show')
    cy.get('#dropdown-menu > div > a.user-content:nth-child(2)').click({ force: true })
    cy.wait(1000)
  }

  loginPageInputTag() {
    cy.get('app-login form input').should('be.visible')
  }

  getLoginButton() {
    return cy.get('app-login form button.is-info').invoke('text')
  }
}
