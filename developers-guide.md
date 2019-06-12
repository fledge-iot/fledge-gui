This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.1.4

## Code scaffolding
Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

> To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


To enable Yarn for Angular CLI, run the following command inside root directory: 
`ng set packageManager=yarn`

## Running unit tests
Run `yarn test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests
Run `yarn e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

Test report will be available in HTML format in `foglamp-gui/e2e-test-report/`; Open `report.html` in your favorite browser!

> Before running the tests make sure app is able to communicate with the FogLAMP REST Server API. Put the REST API info in `e2e/environment.ts`.

### Steps to run e2e test in CI environment on headless machine

#### Installation step on Ubuntu

  1. Install google-chrome-stable
      ```
      $ wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
      $  echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | sudo tee /etc/apt/sources.list.d/google-chrome.list
      $ sudo apt-get update
      $ sudo apt-get install google-chrome-stable
      ```

  2. Clone foglamp-gui & run e2e test
      ```
      $ sudo git clone https://github.com/foglamp/foglamp-gui.git
      $ sudo yarn
      $ sudo yarn e2e --protractor-config=protractor_ci.conf.js
      ``` 

#### Installation step on RHEL/CentOS machine

  1. Install google-chrome-stable
      ```
      $ wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
      $ sudo yum -y install google-chrome-stable_current_x86_64.rpm
      ```

      >If installation fail because of missing `liberation-fonts` dependency. Download and install it first
      ```
      $ yum install liberation-fonts-1.07.2-16.el7.noarch.rpm
      ```

  2. Clone foglamp-gui & run e2e test

      ```
      $ sudo git clone https://github.com/foglamp/foglamp-gui.git
      $ sudo yarn
      $ sudo yarn e2e --protractor-config=protractor_ci.conf.js
      ```

  3. To run tests in a suite
      ```
       $ sudo yarn e2e --suite common --protractor-config=protractor_ci.conf.js
      ```

      > `common,south` are the test suite name defined in protractor_ci.conf.js inside suite section.

## REST API URL Configuration

### Dev Mode
Set default API base URL in `environments/environment.ts`, you can always change it and restart the app from settings. 

### Production Mode
Set API base URL in `environments/environment.prod.ts`, you can always change it and restart the app from settings. 

## Used Libraries

#### Core
 Library      |   Version     | Latest Stable (? Y/n) | License
------------- | ------------- | --------------------  | ------------
 Angular      | 7.2.15        |        8.0.0          | MIT
 Angular CLI  | 7.3.9         |        8.0.2          | MIT
 TypeScript   | 3.2.4         |        3.5.1       | Apache 2.0
 rxjs         | 6.5.2         |        6.5.2          | Apache 2.0
 Bulma css    | 0.7.5         |        0.7.5          | MIT

#### Dev
 Library         |   Version     | Latest Stable (? Y/n) | License
---------------- | ------------- | --------------------  | ------------
chart.js         |  2.8.0        |        2.8.0          | MIT
core-js          |  2.6.9        |        3.1.3          | MIT
ng-sidebar       |  8.0.0        |        8.0.0          | MIT
moment           |  2.23.0       |        2.24.0         | MIT
@ngx-progressbar/core  |  5.3.2        |        5.3.2          | MIT
protractor-beautiful-reporter |  1.2.8       |  1.2.8                | MIT
node-git-describe | 4.0.4     | 4.0.4        | MIT
angular-plotly.js | 1.3.2     | 1.3.2        | MIT
plotly.js         | 1.48.1    | 1.48.1       | MIT

## Update Dependencies
* `npm update`: By running this command, npm checks if there exist newer versions in the repository that satisfy specified semantic versioning ranges and installs them.

#### Fix Vulnerabilities Issues
* `npm audit`: It scan the project for vulnerabilities and just show the details, without fixing anything.

* `npm audit fix`: It scan the project for vulnerabilities and automatically install any compatible updates to vulnerable dependencies.

  #### Note:
   npm command generates `package-lock.json` file. Delete this file and run then `yarn` command to update `yarn.lock` file.
    
## Why Yarn?

* Yarn parallelize operations to maximize resource utilization so install times are faster than ever.
* Offline cache: package installation using Yarn, it places the package on your disk. During the next install, this package will be used instead of sending an HTTP request to get the tarball from the registry.
* Deterministic Installs: Yarn uses lock-files (yarn.lock) and a deterministic install algorithm. We can say goodbye to the "but it works on my machine" bugs.

#### Yarn commands
* `yarn`                    # Install all dependencies from package.json
* `yarn install`            # Alias for yarn
* `yarn add [package]`      # Install npm package
* `yarn upgrade [package]`  # Upgrade npm package
* `yarn remove [package]`   # Uninstall npm package

To read more about yarn read https://yarnpkg.com/en/
