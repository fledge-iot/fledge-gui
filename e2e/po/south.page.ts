export class SouthPage {
  DETERMINISTIC_WAIT = 3000 // in milliseconds
  RETRY_ATTEMPTS = 5
  addServiceRetryAttempts = 5
  fetchAssetRetryAttempts = 5

  /**
   *  Navigate to the south service page
   */
  navToSouthPage() {
    return cy.visit('/#/south')
  }

  /**
   *  get south page title
   */
  getSouthPageTitle() {
    return cy.get('#south-service').invoke('text')
  }

  /**
   *  open south service add wizard
   */
  clickAddServiceButton() {
    return cy.get('#add_south_service').click()
  }

  /**
   * To add south service
   * @prerequisite south service plugin should be pre-installed and discoverable at
   * Fledge side.
   * @param serviceName {string} south service name
   * @param {string}    south plugin name
   */
  addSouthService(serviceName: string) {
    this.waitForServicePluginsToLoad()
      .then(() => {
        // select first plugin
        cy.get('select').select(0).click()
        // supply service name
        cy.get('#name').type(serviceName)
        // click next button thrice
        cy.get('#next').click()
        cy.get('#next').click()
        cy.get('#next').click()
      })
    cy.on("fail", (error) => {
      if (this.addServiceRetryAttempts > 0) {
        console.log('Retrying load service.')
        this.addSouthService(serviceName)
      } else {
        console.log(
          'Rejecting the promise after ' + this.RETRY_ATTEMPTS + ' attempts.'
        )
        return Promise.reject(error)
      }
    })
    this.addServiceRetryAttempts--
  }

  /**
   * Wait for visibility of south service plugin in multi drop-down
   * @param timeOut wait time
   */
  waitForServicePluginsToLoad() {
    return cy.wait(this.DETERMINISTIC_WAIT).get('option').should('be.visible')
  }

  /**
   *  Get added south service name
   */
  getServiceName() {
    cy.wait(this.DETERMINISTIC_WAIT).get('#south-service-list tr:nth-child(1) .button')
    return cy.get('#south-service-list tr:nth-child(1) .button').invoke('text')
  }

  /**
   *  open south service modal
   */
  openSouthServiceModal() {
    cy.wait(this.DETERMINISTIC_WAIT).get('.content table tr:nth-child(1) .button')
    return cy.get('.content table tr:nth-child(1) .button').click()
  }

  /**
   *  get enabled south service asset readings count
   */
  getAssetCount() {
    this.waitForAssetReadingsToLoad()
      .then((found) => {
        return Promise.resolve(found)
      })
    cy.on("fail", (error) => {
      if (this.fetchAssetRetryAttempts > 0) {
        console.log('Retrying to load asset readings.')
        this.getAssetCount()
      } else {
        console.log(
          'Rejecting the promise after ' + this.RETRY_ATTEMPTS + ' attempts.'
        )
        return Promise.reject(error)
      }
    })
    this.fetchAssetRetryAttempts--
    return cy.get('#south-service-list tr:nth-child(1) td:nth-child(3) table tr:nth-child(1) td:nth-child(2) small').invoke('text')
  }

  /**
   * Wait for asset readings count to get visible
   * @param timeOut   wait time
   */
  waitForAssetReadingsToLoad() {
    return cy.wait(this.DETERMINISTIC_WAIT).get('#south-service-list tr:nth-child(1) td:nth-child(3) table tr:nth-child(1) td:nth-child(2) small').should('be.visible')
  }

  /**
   * close south service modal window
   */
  closeSouthServiceModal() {
    cy.get('#south-service-modal .delete').click()
  }
}
