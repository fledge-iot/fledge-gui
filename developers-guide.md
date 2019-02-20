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

## REST API URL Configuration:

### Dev Mode:
Set default API base URL in `environments/environment.ts`, you can always change it and restart the app from settings. 

### Production Mode:
Set API base URL in `environments/environment.prod.ts`, you can always change it and restart the app from settings. 

## Used Libraries:

#### Core:
 Library      |   Version     | Latest Stable (? Y/n) | License
------------- | ------------- | --------------------  | ------------
 Angular      | 7.1.4         |        7.2.0          | MIT 
 Angular CLI  | 7.3.1         |        7.3.1          | MIT 
 TypeScript   | 3.2.4         |        3.3.3          | Apache 2.0
 rxjs         | 6.3.3         |        6.4.0          | Apache 2.0
 Bulma css    | 0.7.2         |        0.7.2          | MIT

#### Dev:
 Library         |   Version     | Latest Stable (? Y/n) | License
---------------- | ------------- | --------------------  | ------------
chart.js         |  2.7.3        |        2.7.3          | MIT
core-js          |  2.6.1        |        2.6.2          | MIT 
ng-sidebar       |  8.0.0        |        8.0.0          | MIT 
moment           |  2.23.0       |        2.23.0         | MIT
@ngx-progressbar/core  |  5.3.2        |        5.3.2          | MIT
protractor-beautiful-reporter |  1.2.7       |  1.2.7                | MIT
node-git-describe | 4.0.4     | 4.0.4        | MIT


#### Why Yarn?

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
