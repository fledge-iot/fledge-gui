
### To Start, Make sure you have:

* Raspberry Pi 

* A micro SD card — Here we will install the Raspbian Stretch Lite

* Another computer to setup the image, Wi-Fi password and SSH access.


First of all go to [Download Raspbian from official raspberry pi website](https://www.raspberrypi.org/downloads/raspbian/). We will use the NON desktop lite version because We only need access to command line and not the graphical user interface.

The easier method to install on the SD card is using Etcher. Go [here](https://etcher.io/) to download Etcher and install it. 

* Connect the SD card.

* Open Etcher and choose the image file (.zip) that you just downloaded (The filename is something like this: 201x-xx-xx-raspbian-stretch-lite.zip).

* Select the SD card you want to write to. And click “Flash!”.

**Enable WiFi**

> IGNORE! if you are connecting via Ethernet.

With the SD card connected. In the root of the SD card create a new file named: `wpa_supplicant.conf`

In the file, Add:

```

country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="your_real_wifi_ssid"
    scan_ssid=1
    psk="your_real_password"
    key_mgmt=WPA-PSK
}

```

* country should be your country code. Change if you are outside of US
* ssid is the name of the Wi-Fi network.
* psk is the password of your Wi-Fi Network

**Enable SSH**

Create an empty file in the root of the SD card named `ssh` (withOUT dot or any extension). 

`touch ssh`

This will enable ssh on your Raspberry Pi.

Put the SD card into Raspberry Pi and plug in the Power cable and wait a little bit so the raspberry boot and connect automatically to Wi-Fi.


### Connect via SSH:

Find the IP Address of your Raspberry Pi. [see help](https://www.raspberrypi.org/documentation/remote-access/ip-address.md)

> Either Ethernet Or WiFi, You need a way to find IP of the raspberry machine.

`ssh pi@<IP>`

`pwd` will show `/home/pi`

**Set Locale**

* Edit /etc/locale.gen and uncomment the line with en_US.UTF-8

* `sudo locale-gen`

> locale-gen reads `/etc/locale.gen` file to know what locales to generate. 

* add `LANGUAGE=en_US.UTF-8` to `/etc/default/locale`

* add `LC_ALL=en_US.UTF-8` to `/etc/default/locale`

After restart you will see the new locale. Run `locale` to view the set locales. 

> You can also set preferred timezone, as the default raspberry pi is shipped with UTC. It can be done with utility `tzselect`.

### Setting up FogLAMP

From your dev machine, `scp raspbian/deploy-core pi@<IP>:/home/pi/`

SSH to Raspbian machine and:

```
git clone https://github.com/foglamp/FogLAMP.git

cd FogLAMP

./requirements.sh

export FOGLAMP_ROOT=`pwd`

make

./scripts/foglamp start
```

### Setting up FogLAMP gui

**On dev machine:**

[Set up dev env](https://github.com/foglamp/foglamp-gui#prerequisites)

`git clone https://github.com/foglamp/foglamp-gui.git` 

> default will be the `develop` branch

`cd foglamp-gui/`

run `./build`

**Copy compressed build file and deploy script to (raspberry pi) Raspbian**

`scp foglamp-gui-x.y.z.tar.gz pi@<IP>:/home/pi/`

> $ scp foglamp-gui-x.y.z.tar.gz pi@<IP>:/home/pi/

> pi@<IP>'s password:

> foglamp-gui-x.y.z.tar.gz    100%  460KB   1.7MB/s   00:00


`scp deploy pi@<IP>:/home/pi/`

> scp deploy pi@<IP>:/home/pi/

> pi@<IP>'s password:

> deploy                 100% 4633   133.5KB/s   00:00


**SSH to Raspbian machine and do:**

`cd /home/pi/`

`./deploy`
