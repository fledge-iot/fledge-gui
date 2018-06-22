# FogLAMP GUI
This is a GUI for FogLAMP

## Prerequisites

[Prerequisite macOS](prerequisite-macos.md)

[Prerequisite Ubuntu](prerequisite-ubuntu.md)

To install dependencies run the following command inside the root directory:

`yarn install`

## Development Server

Run `yarn start` or `yarn start --host [ip_address of host machine]` (to allow access on same network but another machine) for a dev server. Navigate to `http://localhost:4200/` or `http://<ip_address>:4200/`. 

> The app will automatically reload if you change any of the source files.


## Production Build & Deployment
Run `./build` to build the project. The build artifacts will be stored in the `dist/` directory.

> It uses the `-prod` flag with `ng` for a production build.

### Deploy with nginx

#### Install nginx on macOS
```
brew install nginx 
```

#### Install nginx-light on ubuntu
```
  sudo apt-get update
  sudo apt-get install nginx-light
``` 

> To deploy on another machine, you shall need to copy build artifacts stored in the `dist/` directory and (may be you want to use) provided `nginx.conf`; Make sure you have nginx(-light) installed on the deployment machine.

### Starting with nginx

#### macOS and ubuntu

start: `nginx -c nginx.conf -p $(pwd)`

> You should be able to access it on 0.0.0.0:8080

stop: `nginx -s stop`

#### windows

See details [here](windows-nginx-deployment-guide.md)

> Make sure to fix `include` directive and `server root` in `nginx.conf`; unless you want to use default.

## Create debian package

Use `./make_deb` script to create debian package, the package will be placed in `packages/Debian/build/`


## Running using Docker 
[instructions](docker-readme.md)

## Supported/Tested Browser Version
Browser | Tested Version | Supported
--------|-------- |-------
Safari (mac)  | 11.x   | latest 1
Chrome  |66.0.x (64-bit) | latest 2 
Firefox |60.x (64-bit) | latest 2


## Other 
[Changelog](changelog.md)

[Developer's Guide](developers-guide.md)


> &copy; 2017-18 DIANOMIC SYSTEMS. All Rights Reserved.
