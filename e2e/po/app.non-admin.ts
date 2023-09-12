export class NonAdminLogin {

  login() {
    cy.get('app-login form div:nth-child(1) div input[name="username"]').type('user')
    cy.get('app-login form input[name="password"]').type('fledge')
    cy.wait(1000)
    cy.get('app-login form button.is-info').click()
    cy.wait(1000)    
  }

  isUserManagementPresent() {
    cy.wait(2000).get('aside .menu-list').should('be.visible')
    return cy.get('#user-management').should('be.visible')
  }

  getLoggedInUsername() {
    return cy.get('#dropdown-box .navbar-link b').invoke('text')
  }

  navToProfile() {
    cy.get('#dropdown-box > div.dropdown-trigger > a').click()
    cy.get('#dropdown-menu > div > a:nth-child(1)').click()
    cy.wait(2000);
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
}
