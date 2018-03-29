#!/usr/bin/env bash
set -e

# This script is partially done, please track 
# https://github.com/foglamp/foglamp-gui/issues/73

__author__="Mohd. Shariq"
__copyright__="Copyright (c) 2017 OSIsoft, LLC"
__license__="Apache 2.0"
__version__="1.2.0"

# Colors
CPFX="\033["

CRESET="${CPFX}0m"          # Text Reset
CERR="${CPFX}1;31m"
CINFO="${CPFX}1;32m"
CWARN="${CPFX}0;33m"

# Variables
FOGLAMP_GUI_VER=1.2.0

machine_details() {
  # OS Type
  os=$(uname)
  echo -e "${CINFO}Operating System Type :${CRESET} ${os} "

  if [[ ${os} == "Darwin" ]] 
  then
      echo -e Error:"${CERR} Script is not compatible with macOS ${CRESET}" 
      exit 1
  fi

  # Hostname
  echo -e "${CINFO}Hostname : ${CRESET} ${HOSTNAME} " 

  # Internal IP
  internal_ip=$(hostname -I)
  echo -e "${CINFO}Internal IP : ${CRESET} ${internal_ip}"

  # External IP
  external_ip=$(curl -s ipecho.net/plain;echo)
  echo -e "${CINFO}External IP : ${CRESET} ${external_ip}"
  echo     # new line
}

memory_footprints(){
  # Check RAM and SWAP Usages
  rm -f /tmp/ramcache
  free -h | grep -v + > /tmp/ramcache
  
  echo -e "${CINFO}Memory Usages : ${CRESET}"
  cat /tmp/ramcache
  echo     # new line

  # Check Disk Usages
  rm -f /tmp/diskusage
  sudo fdisk -l| grep 'Device\|/dev/mmcblk0*' > /tmp/diskusage
  echo -e "${CINFO}Disk Usages :" ${CRESET}
  cat /tmp/diskusage
  echo     # new line
}

install () {
  if ! which nginx > /dev/null 2>&1; then
      echo -e WARNING: "${CWARN} nginx not installed ${CRESET}"
      yes Y | sudo apt-get install nginx-light
  else
      nginx_version=$(nginx -v 2>&1)
      echo -e INFO: "${CINFO} Found ${nginx_version} ${CRESET}"
  fi
  
  # download foglamp-gui build artifacts i.e. dist directory contents
  # url e.g. http://192.168.1.120/foglamp-gui-${FOGLAMP_GUI_VER}.tar.gz
  # wget ${BUILD_URL}
  # FIXME: scp foglamp-gui-${FOGLAMP_GUI_VER}.tar.gz pi@<IP>:/home/pi
  tar -zxvf foglamp-gui-${FOGLAMP_GUI_VER}.tar.gz

  # put them into /var/www/html and start nginx
  sudo mv dist/* /var/www/html/.

  echo -e INFO: "${CINFO} nginx status ${CRESET}"
  sudo service nginx stop
  sudo service nginx start

  sudo service nginx status
}

############################################################
# Usage text for this script
############################################################
USAGE="$__version__

DESCRIPTION
  This script installs foglamp-gui with nginx-light

OPTIONS
  Multiple commands can be specified but they all must be
  specified separately (-hv is not supported).

  -h, --help     Display this help text
  -v, --version  Display this script's version information

EXAMPLES
  ./$0 --version"

############################################################
# Execute the command specified in $OPTION
############################################################
execute_command() {

  if [[ "$OPTION" == "HELP" ]]
  then
    echo "${USAGE}"

  elif [[ "$OPTION" == "VERSION" ]]
  then
    echo $__version__

  fi
}

start () {
  machine_details
  memory_footprints
  install
  memory_footprints
}

############################################################
# Process arguments
############################################################
if [ $# -gt 0 ]
then
  for i in "$@"
  do
    case $i in
      -h|--help)
        OPTION="HELP"
      ;;

      -v|--version)
        OPTION="VERSION"
      ;;

      *)
        echo "Unrecognized option: $i"
    esac
    execute_command
  done
else
  start
fi
