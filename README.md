# FogLAMP GUI
This is a GUI for FogLAMP

## Prerequisites

[Prerequisite macOS](prerequisite-macos.md)

[Prerequisite Ubuntu](prerequisite-ubuntu.md)

[Prerequisite Windows](prerequisite-windows.md)

To update yarn, Run `sudo npm i -g yarn`

`git clone https://github.com/foglamp/foglamp-gui.git`

`cd  foglamp-gui`

## Development Server

Run `yarn install && yarn start` or `yarn install && yarn start --host [ip_address of host machine]` (to allow access on same network but another machine) for a dev server. Navigate to `http://localhost:4200/` or `http://<ip_address>:4200/`. 

> The app will automatically reload if you change any of the source files.

## Production Build & Deployment

Run `./build --clean-start` to build the project. The build artifacts will be stored in the `dist/` directory.

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

> nginx `-s stop` terminates the nginx process immediately while `-s quit` does a graceful shutdown.

#### windows

See details [here](windows-nginx-deployment-guide.md)

> Make sure to fix `include` directive and `server root` in `nginx.conf`; unless you want to use default.

## Creating and Installing Debian Package
[Debian packaging and usage](debian-readme.md)

## Running using Docker 
[Docker installation and using docker-compose](docker-readme.md)

## Supported/Tested Browser Version
Browser | Tested Version | Supported
--------|-------- |-------
Safari (mac)  | 12.0.x   | latest 1
Chrome  | 72.0.x (64-bit) | latest 2
Firefox | 65.x (64-bit) | latest 2


## Other 
[Changelog](changelog.md)

[Developer's Guide](developers-guide.md)


> &copy; 2017-19 DIANOMIC SYSTEMS. All Rights Reserved.
