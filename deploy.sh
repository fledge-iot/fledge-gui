#!/usr/bin/env bash
set -e

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
NGINX_STABLE_VER=1.12.2

# Define Variable tecreset
tecreset=$(tput sgr0)

conection_details() {
    # Check OS Type
    os=$(uname -o)
    echo -e "${CINFO}Operating System Type : ${CRESET}" $tecreset $os

    # Check hostname
    echo -e "${CINFO}Hostname :${CRESET}" $tecreset $HOSTNAME

    # Check Internal IP
    internalip=$(hostname -I)
    echo -e "${CINFO}Internal IP :${CRESET}" $tecreset $internalip

    # Check External IP
    externalip=$(curl -s ipecho.net/plain;echo)

    echo -e "${CINFO}External IP : $tecreset ${CRESET}"$externalip
    echo     # new line
}

memory_footprints(){
    # Check RAM and SWAP Usages
    free -h | grep -v + > /tmp/ramcache
    echo -e "${CINFO}Ram Usages :${CRESET}" $tecreset

    cat /tmp/ramcache | grep -v "Swap"
    echo -e "${CINFO}Swap Usages :${CRESET}" $tecreset
    cat /tmp/ramcache | grep -v "Mem"
    echo     # new line

    # Check Disk Usages
    df -h| grep 'Filesystem\|/dev/mmcblk0*' > /tmp/diskusage
    echo -e "${CINFO}Disk Usages :${CRESET}" $tecreset 
    cat /tmp/diskusage
    echo     # new line
}

install () {
    if ! which nginx > /dev/null 2>&1; then
        echo -e WARNING: "${CWARN} nginx not installed ${CRESET}"
        sudo apt-get install nginx-light
    else
        nginx_version=$(nginx -v 2>&1)
        echo -e INFO: "${CINFO} Found ${nginx_version} ${CRESET}"
    fi
    
    echo -e INFO: "${CINFO} nginx status ${CRESET}"
    sudo service nginx status
    
    sudo service nginx stop
    sudo service nginx start
    
    # download foglamp-gui build artifacts i.e. dist directory contents
    wget http://192.168.1.120/foglamp-gui-${FOGLAMP_GUI_VER}.tar.gz
    tar -zxvf foglamp-gui-${FOGLAMP_GUI_VER}.tar.gz

    # put them into /var/www/html and start nginx
    sudo mv dist/* /var/www/html/.
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
  -s, --start    Install and start

EXIT STATUS
  This script exits with status code 1 when errors occur.

EXAMPLES
  sh $0 --version"

############################################################
# Execute the command specified in $OPTION
############################################################
execute_command() {

  if [[ "$OPTION" == "HELP" ]]
  then
    echo "${USAGE}"

  elif [ "$OPTION" == "VERSION" ]
  then
    echo $__version__

  elif [ "$OPTION" == "START" ]
  then
    conection_details
    memory_footprints
    install

  fi
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

      -s|--start)
        OPTION="START"
      ;;
      *)
        echo "Unrecognized option: $i"
    esac
    execute_command
  done
else
  echo "${USAGE}"

fi

