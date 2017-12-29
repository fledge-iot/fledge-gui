# Prerequisite to setup FogLAMP UI Client

## Installation

### Node 

#### On Mac
    https://nodejs.org/en/download/

#### On ubuntu
Install nodejs (version 8)

```
    $ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    $ sudo apt-get install nodejs
```    
### Install yarn (prefered over npm)

#### Installing yarn

To install yarn follow the instruction provided on https://yarnpkg.com/en/docs/install

#### On Mac
```    
    brew install yarn --without-node
```
#### On Ubuntu
```
    $ sudo npm install -g yarn
``` 

To enable Yarn for Angular CLI, run the following command inside root directory: 
`ng set packageManager=yarn`
To install dependencies run the following command inside root directory:
`yarn`  or `yarn install`

#### Why Yarn?
* Yarn parallelizes operations to maximize resource utilization so install times are faster than ever.
* Offline cache: package installation using Yarn, it places the package on your disk. During the next install, this package will be used instead of sending an HTTP request to get the tarball from the registry.
* Deterministic Installs: Yarn uses lockfiles (yarn.lock) and a deterministic install algorithm. We can say goodbye to the "but it works on my machine" bugs.

#### Yarn commands
* `yarn`                    # Install all dependencies from package.json
* `yarn install`            # Alias for yarn
* `yarn add [package]`      # Install npm package
* `yarn upgrade [package]`  # Upgrade npm package
* `yarn remove [package]`   # Uninstall npm package

To read more about yarn read https://yarnpkg.com/en/

   
### Clone the soucre repository

https://github.com/praveen-garg/FogLAMP.git

### Move to `src/frontend` directory and run
```
    $ yarn install
```  
