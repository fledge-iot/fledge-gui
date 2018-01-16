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
Run `yarn build` to build the project. The build artifacts will be stored in the `dist/` directory. 

> It uses the `-prod` flag with `ng` for a production build.

### Deploy with nginx

#### Install nginx on mac 
```
brew install nginx 
```

#### Install nginx-light on ubuntu
```
  sudo apt-get update
  sudo apt-get install nginx-light
```

Run `yarn build` and start nginx from root directory with given `nginx-conf` file; See next section. 

> To deploy on another machine, you shall need to copy build artifacts stored in the `dist/` directory and provided `nginx.conf`; Make sure you have nginx(-light) installed on the deployment machine.

### Starting with nginx

start: `nginx -c nginx.conf -p $(pwd)`

stop: `nginx -s stop`

> You should be able to access it on 0.0.0.0:8080


## Running using Docker 
[instructions](docker-readme.md)

## Supported/Tested Browser Version
Browser | Tested Version | Supported
--------|-------- |-------
Safari (mac)  | 11.0.x   | latest 1
Chrome  |63.0.x (64-bit) | latest 2 
Firefox |57.0.x (64-bit) | latest 2


## Other 
[Changelog](changelog.md)

[Developer's Guide](developers-guide.md)


> &copy; 2017 DIANOMIC SYSTEMS. All Rights Reserved.