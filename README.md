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

## Using debian package

#### Create debian package

Use `./make_deb` script to create debian package, the package will be placed in `packages/Debian/build/`

```
 $ ./make_deb
Operating System Type: Linux
The package root directory is         : /home/foglamp/foglamp-gui
The FogLAMP gui version is            : 1.3.0
The Package will be built in          : /home/foglamp/foglamp-gui/packages/build
The package name is                   : foglamp-gui-1.3.0

INFO:  Cleaning the build and dependencies ...
yarn run v1.3.2
$ rm -rf dist && rm -rf node_modules && yarn cache clean
success Cleared cache.
Done in 1.98s.
INFO:  Installing dependencies ...
yarn install v1.3.2
[1/4] Resolving packages...
[2/4] Fetching packages...
...

Done in 320.72s.
INFO:  Creating production build ...
yarn run v1.3.2
$ ng build --prod --build-optimizer
.....

Done in 56.37s.
INFO:  Build distribution contents  ...
...
4.0K    dist/index.html
1.2M    dist/main.104c5596418ab60d3be6.js
64K     dist/polyfills.69e1297e41447c327ff4.js
...
INFO   Size: 4.0M       dist
INFO:  Removing unwanted contents ...
INFO:  Deployable dist size   2.0M      dist
INFO:  Creating compressed build artifacts for release ...
Created foglamp-gui-1.3.0.tar.gz
INFO:  Done.
Populating the package and updating version file...
Done.
Copy build artifacts for nginx webroot directory...
Done.
Building the new debian package...
dpkg-deb: building package 'foglamp-gui' in 'foglamp-gui-1.3.0.deb'.
Done.

```

#### Install debian package

```
$sudo cp packages/build/foglamp-gui-1.3.0.deb /var/cache/apt/archives/.
$sudo apt install /var/cache/apt/archives/foglamp-gui-1.3.0.deb
```

> you may want to check debian package contents with `sudo dpkg -c foglamp-gui-1.3.0.deb` or can install in dev env with `sudo dpkg -i foglamp-gui-1.3.0.deb`

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
