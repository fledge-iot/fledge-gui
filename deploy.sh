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
FOGLAMP_GUI_VER=1.2.0  # if not defined as -foglamp-version

install () {
    if ! which nginx > /dev/null 2>&1; then
        echo -e  WARNING: "${CWARN} WARNING: nginx not installed  ${CRESET}"
        sudo apt-get install nginx-light
    else
        nginx_version=$(nginx -v 2>&1)
        echo -e  INFO: "${CINFO} Found ${nginx_version} ${CRESET}"
    fi
    
    # download foglamp-gui build artifacts i.e. dist directory contents
    # wget http://192.168.1.120/foglamp-gui-${FOGLAMP_GUI_VER}.tar.gz
    tar -zxvf dist.tar.gz

    # put them into /var/www/html and start nginx
    sudo mv dist/* /var/www/html/.

    # check nginx is good
    echo  -e  INFO: "${CINFO} nginx status  ${CRESET}"
    sudo service nginx status

    sudo service nginx stop
    sudo service nginx start
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

  if [ "$OPTION" == "HELP" ]
  then
    echo "${USAGE}"

  elif [ "$OPTION" == "VERSION" ]
  then
    echo $__version__

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
      
      *)
        echo "Unrecognized option: $i"
    esac

    execute_command
  done
else
  install
fi
