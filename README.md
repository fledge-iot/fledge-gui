# FogLAMP GUI
This is a GUI for FogLAMP

## Prerequisites

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.4.3.

[Prerequisite](prerequisite.md)

## Code scaffolding
Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

> To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Development server
Run `yarn start` or `yarn start --host [ip_address of host machine]` (to allow access on same network but another machine) for a dev server. Navigate to `http://localhost:4200/` or `http://<ip_address>:4200/`. The app will automatically reload if you change any of the source files.

## Running unit tests
Run `yarn test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests
Run `yarn e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

> Before running the tests make sure app is able to communicate with the FogLAMP REST Server API.

## Build
Run `yarn build` to build the project. The build artifacts will be stored in the `dist/` directory. It uses the `-prod` flag with `ng` for a production build.

## Deploy with nginx

#### Install nginx on mac 
```
brew install nginx 
```

#### Install nginx-light on ubuntu
```
  sudo apt-get update
  sudo apt-get install nginx-light
```

run `yarn build` and start nginx from root directory with given conf file; See next section. 

> To deploy on another machine, you shall need to copy build artifacts stored in the `dist/` directory and provided `nginx.conf`; Make sure you have nginx-light installed on the deployment machine.

## Starting with nginx
start: `nginx -c nginx.conf -p $(pwd)`

stop: `nginx -s stop`

you should be able to access it on 0.0.0.0:8080

## REST API URL Configuration:

### Dev Mode:
Set default API base URL in `environments/environment.ts`, you can always change it and restart the app from settings. 

### Production Mode:
Set API base URL in `environments/environment.prod.ts`, you can always change it and restart the app from settings. 

### Running using Docker 
  [instructions](docker-readme.md)

## Supported/Tested Browser Version
Browser | Tested Version | Supported
--------|-------- |-------
Safari (mac)  | 11.0.x   | latest 1
Chrome  |63.0.x (64-bit) | latest 2 
Firefox |57.0.x (64-bit) | latest 2

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