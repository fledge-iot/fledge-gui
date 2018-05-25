#!/usr/bin/env bash
set -e

yes Y |  sudo apt-get install git
yes Y |  sudo apt-get upgrade
yes Y |  sudo apt-get update


yes Y |  sudo apt-get install cmake g++ make build-essential autoconf automake
yes Y |  sudo apt-get install libtool libboost-dev libboost-system-dev libboost-thread-dev libpq-dev
yes Y |  sudo apt-get install python-dbus python-dev python3-pip

yes Y |  sudo apt-get install bluez
yes Y |  sudo apt-get install uuid-dev

yes Y |  sudo apt-get install postgresql
sudo -u postgres createuser -d pi

yes Y |  sudo apt-get install sqlite3 libsqlite3-dev
