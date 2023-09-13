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
    cy.get('#user-management').should('not.exist')
  }

  getLoggedInUsername() {
    return cy.get('#dropdown-box .navbar-link b').invoke('text')
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
}
