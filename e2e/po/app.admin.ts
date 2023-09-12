export class AdminLogin {

  login() {
    cy.get('app-login form div:nth-child(1) div input[name="username"]').type('admin')
    cy.get('app-login form input[name="password"]').type('fledge')
    cy.wait(1000)
    cy.get('app-login form button.is-info').click()
  }

  isUserManagementPresent() {
    cy.wait(2000)
    return cy.get('#user-management').should('be.visible')
  }

  navToUserManagement() {
    return cy.visit('/#/user-management')
  }

  getAllTabs() {
    return cy.get('app-user-management header .tabs ul').invoke('text')
  }

  isAddUserPresent() {
    return cy.get('app-user-management header .tabs div').invoke('text')
  }

  getUserManagementColNames() {
    return cy.get('#head').invoke('text')
  }

  gotoRoles() {
    cy.get('app-user-management header .tabs li:nth-child(2) a').invoke('text')
  }

  getRolesColNames() {
    return cy.get('app-user-management table thead').invoke('text')
  }

  navToProfile() {
    cy.get('#dropdown-box > div.dropdown-trigger > a').click()
    cy.get('#dropdown-menu > div > a:nth-child(1)').click()
    cy.wait(2000)
  }

  profileTitle() {
    return cy.get('.card .card-header-title').invoke('text')
  }

  labelUsername() {
    return cy.get('#edit_profile > div:nth-child(1) > div > label').invoke('text')
  }

  labelRole() {
    return cy.get('#edit_profile > div:nth-child(2) > div > label').invoke('text')
  }

  isChangePassword() {
    return cy.get('#edit_profile > div:nth-child(3) > div > a').invoke('text')
  }

  isLogoutActiveSessionButton() {
    return cy.get('#edit_profile .button.is-warning').invoke('text')
  }

  changePassword() {
    cy.get('#edit_profile > div:nth-child(3) > div > a').click()
  }

  getInputTagCount() {
    // return cy.get('#ngForm input').count()
  }

  isSaveButton() {
    return cy.get('#update').should('be.visible')
  }

  closeModal() {
    cy.get('#user_profile_modal .delete').click()
  }

  logout() {
    cy.get('#dropdown-box > div.dropdown-trigger > a').click()
    // wait
    cy.wait(2000).get('#dropdown-menu > div > a:nth-child(2)').should('be.visible')
    cy.get('#dropdown-menu > div > a:nth-child(2)').click()
    cy.wait(1000)
  }

  loginPageInputTag() {
    // return cy.get('app-login form input').count()
  }

  getLoginButton() {
    return cy.get('app-login form button.is-info').invoke('text')
  }
}
