# FogLAMP GUI
This is a GUI for FogLAMP

## Prerequisites

[Prerequisite macOS](prerequisite-macos.md)

[Prerequisite Ubuntu](prerequisite-ubuntu.md)

[Prerequisite RHEL/ CentOS](prerequisite-redhat.md)

[Prerequisite Windows](prerequisite-windows.md)

To update yarn, Run `sudo npm i -g yarn`

`git clone https://github.com/foglamp/foglamp-gui.git`

`cd  foglamp-gui`

## Development Server

Run `yarn install && yarn start` or `yarn install && yarn start --host [ip_address of host machine]` (to allow access on same network but another machine) for a dev server. Navigate to `http://localhost:4200/` or `http://<ip_address>:4200/`. 

> The app will automatically reload if you change any of the source files.

## Production Build & Deployment

Run `./build --clean-start` to build the project. The build artifacts will be stored in the `dist/` directory.

To deploy on another machine, you shall need to copy build artifacts stored in the `dist/` directory (and may be you want to use provided `nginx.conf`, to avoid changes in default nginx config); Make sure you have nginx(-light) installed on the deployment machine.

### Starting with nginx

start: `nginx -c nginx.conf -p $(pwd)`

> You should be able to access it on 0.0.0.0:8080

stop: `nginx -s stop`

> nginx `-s stop` terminates the nginx process immediately while `-s quit` does a graceful shutdown.


For **windows**, see details [here](windows-nginx-deployment-guide.md)

> Make sure to fix `include` directive and `server root` in `nginx.conf`; unless you want to use default.

## Creating and Installing Debian/ RPM Package
[Debian packaging and usage](debian-readme.md)

[RPM packaging and usage](rpm-readme.md)

## Running using Docker 
[Docker installation and using docker-compose](docker-readme.md)

## Supported/ Tested Browser Version
Browser | Tested Version | Supported
--------|-------- |-------
Safari (mac)  | 12.1.x   | latest 1
Chrome  | 75.0.x (64-bit) | latest 2
Firefox | 67.0.x (64-bit) | latest 2


[Changelog](changelog.md)

[Developer's Guide](developers-guide.md)


> &copy; 2017-19 DIANOMIC SYSTEMS INC. All Rights Reserved.
