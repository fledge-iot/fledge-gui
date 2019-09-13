
### Create RPM package

Make sure [RHEL/ CentOS prerequisites](prerequisite-redhat.md), [rpm-build and other packages](https://rpm-packaging-guide.github.io/#prerequisites) are installed.

Use `sudo ./make_rpm` script to create RPM package, the package will be placed in `packages/build/`

```
$sudo ./make_rpm
Red Hat
The package root directory is         : /home/foglamp/foglamp-gui
The FogLAMP gui version is            : 1.6.0
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
INFO   Size: 8.0M       dist
INFO:  Removing unwanted contents ...
INFO:  Deployable dist size   2.4M      dist
Copying custom nginx conf file ...
INFO:  Creating compressed build artifacts for release ...
Created foglamp-gui-x.y.z.tar.gz
INFO:  Done.
Populating the package and updating version file...
Done.
Copy build artifacts for nginx webroot directory...
Done.
Building the new rpm package...
Processing files: foglamp-gui-x.y.z-1.x86_64
Provides: foglamp-gui = x.y.z-1 foglamp-gui(x86-64) = x.y.z-1
...
Wrote: /foglamp-gui/packages/build/foglamp-gui-x.y.z/RPMS/x86_64/foglamp-gui-x.y.z-1.x86_64.rpm
Done.

```

> You may want to check the created RPM package content with `sudo rpm -qplv foglamp-gui-x.y.z-1.x86_64.rpm`


### Installing rpm package

**Install and enable the EPEL rpm package**

```
sudo yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
sudo yum -y update
```

```
$ cp packages/build/foglamp-gui-x.y.z/RPMS/x86_64/foglamp-gui-x.y.z-1.x86_64.rpm /var/cache/yum/x86_64/.

$ yum install /var/cache/yum/x86_64/foglamp-gui-x.y.z-1.x86_64.rpm
```



### Uninstalling rpm package

```
$ yum list installed | grep foglamp-gui
$ yum remove foglamp-gui.x86_64
```
