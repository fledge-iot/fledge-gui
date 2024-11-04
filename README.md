# Fledge GUI

Web GUI for Fledge

## Prerequisites

[Prerequisite macOS](docs/prerequisite-macos.md)

[Prerequisite Ubuntu](docs/prerequisite-ubuntu.md)

[Prerequisite RHEL/ CentOS](docs/prerequisite-redhat.md)

[Prerequisite Windows](docs/prerequisite-windows.md)

To update yarn, Run `sudo npm i -g yarn`

```
git clone https://github.com/fledge-iot/fledge-gui.git
cd fledge-gui
```

## Development Server

Run `yarn install && yarn start` & Navigate to http://localhost:4200/

To allow access on other browser devices, over the same network, You can set host to `0.0.0.0`/IP address of the development machine. You can also set a different web port, default port is 4200.

`yarn install && yarn start --host 0.0.0.0 --port <PORT>`

`http://<IP OF HOST MACHINE>:<PORT>/`

> The app will automatically reload if you change any of the source files.

## Production Build & Deployment

Run `./build --clean-start` to build the project. The build artifacts will be stored in the `dist/` directory.

To deploy on another machine, You shall need to copy build artifacts stored in the `dist/` directory (and, you may want to use provided `nginx.conf`; to avoid changes in default nginx config).

> Make sure you have nginx(-light) installed on the deployment machine.

### Starting with nginx

start: `nginx -c nginx.conf -p $(pwd)`

stop: `nginx -s stop`

> nginx `-s stop` terminates the nginx process immediately while `-s quit` does a graceful shutdown.

For **windows**, see details [here](docs/windows-nginx-deployment-guide.md)

> Make sure to fix `include` directive and `server root` in `nginx.conf`; unless you want to use default.

## Creating and Installing Debian/ RPM Package

[Debian packaging and usage](docs/debian-readme.md)

[RPM packaging and usage](docs/rpm-readme.md)

## Running using Docker

[Docker installation and using docker-compose](docs/docker-readme.md)

## Supported/ Tested Browser Version

| Browser        | Tested Version   | Supported |
| -------------- | ---------------- | --------- |
| Safari (macOS) | 17.5.x           | latest 1  |
| Chrome         | 128.0.x (64-bit) | latest 2  |
| Firefox        | 131.0.x (64-bit) | latest 2  |
| Microsoft Edge | 123.0.x (64-bit) | latest 2  |

[Changelog](docs/changelog.md)

[Developer's Guide](docs/developers-guide.md)

## Contributing to Fledge

See [Contributing Statement](CONTRIBUTING.md)

> &copy; 2024 DIANOMIC SYSTEMS, INC. All Rights Reserved.
