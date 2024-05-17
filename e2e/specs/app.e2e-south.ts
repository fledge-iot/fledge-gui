import { SouthPage } from '../po/south.page'
import { Filters } from '../po/app.filters'
import { SkipLogin } from 'e2e/po/app.skip'

describe('Fledge South Page tests', () => {
  const southPage = new SouthPage()
  const filters = new Filters()
  const skipLogin = new SkipLogin();

  beforeEach(() => {
    skipLogin.setUpInstance();
    skipLogin.navigateToHome();
  });

  it('Should display south service page', () => {
    southPage.navToSouthPage()
    southPage.getSouthPageTitle().then(title =>{
      expect(title.trim()).to.equal('South Services')
    })
  })

  it('Should display added south service', () => {
    southPage.navToSouthPage()
    southPage.clickAddServiceButton()
    southPage.addSouthService('guiE2eService #1') // pass south service name
    southPage.getServiceName().then(serviceName =>{
      expect(serviceName.trim()).to.equal('guiE2eService #1')
    })
  })

  it('Should display added filter in south service', () => {
    southPage.navToSouthPage()
    southPage.openSouthServiceModal()
    filters.openFilterWizard()
    filters.addFilter('guiE2eFilter #1')
    filters.getAddedFilterName().then(filterName =>{
      expect(filterName.trim()).to.equal('guiE2eFilter #1')
    })
    southPage.closeSouthServiceModal()
  })

  it('Should display asset count on south service', () => {
    southPage.navToSouthPage()
    southPage.getAssetCount().then((assetCount) => {
      assetCount = assetCount.split(",").join("")
      assert.isAtLeast(+assetCount, 1)
    })
  })
})
