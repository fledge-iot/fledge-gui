This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.12

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

> To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

To enable Yarn for Angular CLI, run the following command inside root directory:
`ng set packageManager=yarn`

## Running unit tests

Run `yarn test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `yarn e2e` to execute the end-to-end tests via [Cypress](https://www.cypress.io/).

Test report will be available in HTML & XML format in `fledge-gui/e2e/reports/`; Open `index.html` in your favorite browser!

> Before running the tests make sure app is able to communicate with the Fledge REST Server API. Put the REST API info in `e2e/environment.ts`.

### Steps to run e2e test in CI environment on headless machine

#### Installation step on Ubuntu

1. Install google-chrome-stable

   ```
   $ wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
   $  echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | sudo tee /etc/apt/sources.list.d/google-chrome.list
   $ sudo apt-get update
   $ sudo apt-get install google-chrome-stable
   ```

2. Clone fledge-gui & run e2e test

   ```
   $ sudo git clone https://github.com/fledge/fledge-gui.git
   ```

   > For CI integration to run on Ubuntu machine, please use e2e/run script.

   ```
   $ sudo yarn
   $ sudo yarn e2e
   ```

#### Installation step on RHEL/CentOS machine

1. Install google-chrome-stable

   ```
   $ wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
   $ sudo yum -y install google-chrome-stable_current_x86_64.rpm
   ```

   > If installation fail because of missing `liberation-fonts` dependency. Download and install it first

   ```
   $ yum install liberation-fonts-1.07.2-16.el7.noarch.rpm
   ```

2. Clone fledge-gui & run e2e test

   ```
   $ sudo git clone https://github.com/fledge/fledge-gui.git
   $ sudo yarn
   $ sudo yarn e2e
   ```

3. To run tests in a suite

   ```
    $ sudo yarn e2e --spec "e2e/specs/app.e2e-common.ts"
   ```

   > `app.e2e-common.ts, app.e2e-south.ts` are the spec files name defined in cypress.config.ts inside specPattern section.

## REST API URL Configuration

### Dev Mode

Set default API base URL in `environments/environment.ts`, You can always change it and restart the app from settings.

### Production Mode

Set API base URL in `environments/environment.prod.ts`, You can always change it and restart the app from settings.

## Used Libraries

#### Core

| Library         | Version | Latest Stable (? Y/n) | License    |
| --------------- | ------- | --------------------- | ---------- |
| Angular         | 16.2.12 | 18.0.4                | MIT        |
| Angular CLI     | 16.2.12 | 18.0.4                | MIT        |
| Bulma css       | 0.9.4   | 1.0.1                 | MIT        |
| Font-Awesome    | 6.4.0   | 6.4.0                 | MIT        |
| Bootstrap-Icons | 1.11.1  | 1.11.3                | MIT        |

#### Dev

| Library                        | Version | Latest Stable (? Y/n) | License |
| ------------------------------ | ------- | --------------------- | ------- |
| chart.js                       | 4.3.0   | 3.9.1                 | MIT     |
| moment                         | 2.29.3  | 2.29.3                | MIT     |
| ngx-progressbar                | 8.0.0   | 9.0.0                 | MIT     |
| node-git-describe              | 4.1.0   | 4.1.0                 | MIT     |
| plotly.js                      | 2.12.1  | 2.12.1                | MIT     |
| @ctrl/ngx-codemirror           | 5.1.1   | 5.1.1                 | MIT     |
| codemirror                     | 5.65.3  | 5.65.3                | MIT     |
| @ng-select/ng-select           | 8.1.1   | 8.1.1                 | MIT     |
| @ali-hm/angular-tree-component | 12.0.5  | 12.0.5                | MIT     |
| @kurkle/color                  | 0.1.9   | 0.1.9                 | MIT     |
| Animate.css                    | 4.1.1   | 4.1.1                 | MIT     |
| bulma-toast                    | 2.4.2   | 2.4.2                 | MIT     |


## Update Dependencies

- `npm update`: By running this command, npm checks if there exist newer versions in the repository that satisfy specified semantic versioning ranges and installs them.

#### Fix Vulnerabilities Issues

- `npm audit`: It scan the project for vulnerabilities and just show the details, without fixing anything.

- `npm audit fix`: It scan the project for vulnerabilities and automatically install any compatible updates to vulnerable dependencies.

  #### Note:

  npm command generates `package-lock.json` file. Delete this file and run then `yarn` command to update `yarn.lock` file.

## Why Yarn?

- Yarn parallelize operations to maximize resource utilization so install times are faster than ever.
- Offline cache: package installation using Yarn, it places the package on your disk. During the next install, this package will be used instead of sending an HTTP request to get the tarball from the registry.
- Deterministic Installs: Yarn uses lock-files (yarn.lock) and a deterministic install algorithm. We can say goodbye to the "but it works on my machine" bugs.

#### Yarn commands

- `yarn` # Install all dependencies from package.json
- `yarn install` # Alias for yarn
- `yarn add [package]` # Install npm package
- `yarn upgrade [package]` # Upgrade npm package
- `yarn remove [package]` # Uninstall npm package

To read more about yarn read https://yarnpkg.com/en/
