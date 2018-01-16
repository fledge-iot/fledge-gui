This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.4.3.

## Code scaffolding
Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

> To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


To enable Yarn for Angular CLI, run the following command inside root directory: 
`ng set packageManager=yarn`

## Running unit tests
Run `yarn test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests
Run `yarn e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

> Before running the tests make sure app is able to communicate with the FogLAMP REST Server API.

## REST API URL Configuration:

### Dev Mode:
Set default API base URL in `environments/environment.ts`, you can always change it and restart the app from settings. 

### Production Mode:
Set API base URL in `environments/environment.prod.ts`, you can always change it and restart the app from settings. 

## Used Libraries:

#### Core:
 Library      |   Version     | Latest Stable (? Y/n) | License
------------- | ------------- | --------------------  | ------------
 Angular 4    | 4.4.3         |        4.4.4          | MIT 
 Angular CLI  | 1.4.3         |        1.4.4          | MIT 
 TypeScript   | 2.4.2         |        2.5            | Apache 2.0
 rxjs         | 5.4.3         |        5.4.3          | Apache 2.0

#### Dev:
 Library         |   Version     | Latest Stable (? Y/n) | License
---------------- | ------------- | --------------------  | ------------
chart.js         |  2.7.0        |        2.7.0          | MIT 
core-js          |  2.5.1        |        2.5.1          | MIT 
loadash          |  4.17.4       |        4.17.4         | MIT
ngx-mask         |  1.0.3        |        1.0.3          | MIT 
ng-sidebar       |  6.0.2        |        6.0.2          | MIT 
moment           |  2.19.2       |        2.19.2         | MIT
ngx-progressbar  |  2.1.1        |        2.1.1          | MIT


#### Why Yarn?

* Yarn parallelizes operations to maximize resource utilization so install times are faster than ever.
* Offline cache: package installation using Yarn, it places the package on your disk. During the next install, this package will be used instead of sending an HTTP request to get the tarball from the registry.
* Deterministic Installs: Yarn uses lockfiles (yarn.lock) and a deterministic install algorithm. We can say goodbye to the "but it works on my machine" bugs.

#### Yarn commands
* `yarn`                    # Install all dependencies from package.json
* `yarn install`            # Alias for yarn
* `yarn add [package]`      # Install npm package
* `yarn upgrade [package]`  # Upgrade npm package
* `yarn remove [package]`   # Uninstall npm package

To read more about yarn read https://yarnpkg.com/en/