#!/usr/bin/env bash
set -e

yes Y |  sudo apt-get update
yes Y |  sudo apt-get upgrade

yes Y |  sudo apt-get install git
yes Y |  sudo apt-get install curl

yes Y |  sudo apt-get install cmake g++ make build-essential autoconf automake
yes Y |  sudo apt-get install libtool libboost-dev libboost-system-dev libboost-thread-dev libpq-dev
yes Y |  sudo apt-get install python-setuptools python3-dbus python3-dev python3-pip

yes Y |  sudo apt-get install bluez
yes Y |  sudo apt-get install uuid-dev
yes Y |  sudo apt-get install jq

# default SQLite
yes Y |  sudo apt-get install sqlite3 libsqlite3-dev

# Required, until postgres depdendecies are plugged out
yes Y |  sudo apt-get install postgresql postgresql-server-dev-9.6
sudo -u postgres createuser -d pi
