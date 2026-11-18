## Installation 

### Mac & Windows

Install Docker CE for Mac and Windows (http://docker.com)

### Ubuntu

To install Docker CE follow the instructions given here:

https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/

#### Install docker-compose

```
    $ sudo apt install docker-compose
```
### Run app

> The image builds the GUI itself, so no local `./build` is needed.

```
    $ docker-compose build
    $ docker-compose up 
```

> To run in deamon mode: `docker-compose up -d`

Navigate to http://localhost:8080

### Stopping docker-compose
```
    $ docker-compose down
```
