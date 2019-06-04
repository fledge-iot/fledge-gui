
### Create debian package

Make sure [prerequisites](prerequisite-ubuntu.md) are installed.

Use `./make_deb` script to create debian package, the package will be placed in `packages/build/`

```
 $ ./make_deb
Operating System Type: Linux
The package root directory is         : /home/foglamp/foglamp-gui
The FogLAMP gui version is            : x.y.z
The package will be built in          : /home/foglamp/foglamp-gui/packages/build
The package name is                   : foglamp-gui-x.y.z

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
4.0K    dist/foglamp.html
1.2M    dist/main.104c5596418ab60d3be6.js
64K     dist/polyfills.69e1297e41447c327ff4.js
...
INFO   Size: 4.0M       dist
INFO:  Removing unwanted contents ...
INFO:  Deployable dist size   2.3M      dist
INFO:  Creating compressed build artifacts for release ...
Created foglamp-gui-x.y.z.tar.gz
INFO:  Done.
Populating the package and updating version file...
Done.
Copy build artifacts for nginx webroot directory...
Done.
Building the new debian package...
dpkg-deb: building package 'foglamp-gui' in 'foglamp-gui-x.y.z.deb'.
Done.

```

#### Installing debian package

Use the ``apt`` or the ``apt-get`` command

```
$sudo cp packages/build/foglamp-gui-x.y.z.deb /var/cache/apt/archives/.
$sudo apt install /var/cache/apt/archives/foglamp-gui-x.y.z.deb
```

#### Uninstalling debian package

```
$ sudo apt remove foglamp-gui
```

> you may want to check debian package contents with `sudo dpkg -c foglamp-gui-x.y.z.deb` or can install in dev env with `sudo dpkg -i foglamp-gui-x.y.z.deb`
