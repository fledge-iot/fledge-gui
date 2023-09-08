import { SouthPage } from '../po/south.page'
import { Filters } from '../po/app.filters'

describe('Fledge South Page tests', () => {
  const southPage = new SouthPage()
  const filters = new Filters()

  it('Should display south service page', () => {
    southPage.navToSouthPage()
    expect(southPage.getSouthPageTitle()).to.equal('South Services')
  })

  it('Should display added south service', () => {
    southPage.clickAddServiceButton()
    southPage.addSouthService('guiE2eService #1') // pass south service name
    expect(southPage.getServiceName()).to.equal('guiE2eService #1')
  })

  it('Should display added filter in south service', () => {
    southPage.openSouthServiceModal()
    filters.openFilterWizard()
    filters.addFilter('guiE2eFilter #1')
    expect(filters.getAddedFilterName()).to.equal(' guiE2eFilter #1')
    southPage.closeSouthServiceModal()
  })

  it('Should display asset count on south service', () => {
    southPage.getAssetCount().then((value) => {
      assert.isAtLeast(+value, 1)
    })
  })
})
