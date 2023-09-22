export class Filters {
  DETERMINISTIC_WAIT = 3000; // in milliseconds
  RETRY_ATTEMPTS = 5;
  addFilterRetryAttempts = 5;

  /**
   * open filter wizard
   */
  openFilterWizard() {
    return cy.get('.add-application a').click()
  }

  /**
   * Add a filter in south service pipeline
   * @prerequisite A south service should be added in the Fledge.
   * A filter should be installed and discoverable at Fledge side.
   * @param filterName {string} filter name
   * @param {string}   filter plugin name
   */
  addFilter(filterName: string) {
    this.waitForFilterPluginsToLoad().then(() => {
      // select first plugin in select box
      cy.get('select').select(0)
      // supply filter name
      cy.get('#name').type(filterName)
      // click next button twice
      cy.get('#next').click()
      cy.get('#next').click()
    })
    cy.on("fail", (error) => {
      if (this.addFilterRetryAttempts > 0) {
        console.log('Retrying load filter plugin.');
        this.addFilter(filterName);
      } else {
        console.log('Rejecting the promise after ' + this.RETRY_ATTEMPTS + ' attempts.');
        return Promise.reject(error);
      }
    });
    this.addFilterRetryAttempts--;
  }

  /**
   * Wait for filter plugin visibility
   */
  waitForFilterPluginsToLoad() {
    return cy.wait(this.DETERMINISTIC_WAIT).get('option').should('be.visible')
  }

  /**
   *  Get filter name
   */
  getAddedFilterName() {
    cy.wait(this.DETERMINISTIC_WAIT)
    return cy.get('#list-item-0 .card-header-title').invoke('text')
  }
}
