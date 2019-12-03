import { browser, by, element } from 'protractor';

export class AdminLogin {
    EC = browser.ExpectedConditions;

  login() {
    browser.ignoreSynchronization = true;
    element(by.css('app-login form div:nth-child(1) div input[name="username"]')).sendKeys('admin');
    element(by.css('app-login form input[name="password"]')).sendKeys('fledge');
    browser.sleep(1000);
    element(by.css('app-login form button.is-info')).click();
  }

  isUserManagementPresent() {
    browser.sleep(2000);
    return element(by.id('user-management')).isPresent();
  }

  navToUserManagement() {
    browser.ignoreSynchronization = true;
    return browser.get('/#/user-management');
  }

  getAllTabs() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-user-management header .tabs ul')).getText();
  }

  isAddUserPresent() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-user-management header .tabs div')).getText();
  }

  getUserManagementColNames() {
    browser.ignoreSynchronization = true;
    return element(by.id('head')).getText();
  }

  gotoRoles() {
    browser.ignoreSynchronization = true;
    element(by.css('app-user-management header .tabs li:nth-child(2) a')).getText();
  }

  getRolesColNames() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-user-management table thead')).getText();
  }

  navToProfile() {
    browser.ignoreSynchronization = true;
    element(by.css('#dropdown-box > div.dropdown-trigger > a')).click();
    element(by.css('#dropdown-menu > div > a:nth-child(1)')).click();
    browser.sleep(2000);
  }

  profileTitle() {
    browser.ignoreSynchronization = true;
    return element(by.css('.card .card-header-title')).getText();
  }

  labelUsername() {
    browser.ignoreSynchronization = true;
    return element(by.css('#edit_profile > div:nth-child(1) > div > label')).getText();
  }

  labelRole() {
    browser.ignoreSynchronization = true;
    return  element(by.css('#edit_profile > div:nth-child(2) > div > label')).getText();
  }

  isChangePassword() {
    browser.ignoreSynchronization = true;
    return element(by.css('#edit_profile > div:nth-child(3) > div > a')).getText();
  }

  isLogoutActiveSessionButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('#edit_profile .button.is-warning')).getText();
  }

  changePassword() {
    browser.ignoreSynchronization = true;
    element(by.css('#edit_profile > div:nth-child(3) > div > a')).click();
  }

  getInputTagCount() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('#ngForm input')).count();
  }

  isSaveButton() {
    browser.ignoreSynchronization = true;
    return element(by.id('update')).isDisplayed();
  }

  closeModal() {
    browser.ignoreSynchronization = true;
    element(by.css('#user_profile_modal .delete')).click();
  }

  logout() {
    browser.ignoreSynchronization = true;
    element(by.css('#dropdown-box > div.dropdown-trigger > a')).click();
    // wait
    browser.wait(this.EC.visibilityOf(element(by.css('#dropdown-menu > div > a:nth-child(2)'))), 2000);
    element(by.css('#dropdown-menu > div > a:nth-child(2)')).click();
    browser.sleep(1000);
  }

  loginPageInputTag() {
    browser.ignoreSynchronization = true;
    return element.all(by.css('app-login form input')).count();
  }

  getLoginButton() {
    browser.ignoreSynchronization = true;
    return element(by.css('app-login form button.is-info')).getText();
  }
}
