#!/usr/bin/env bash

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

############################################################
# Usage text for this script
############################################################
USAGE="$__version__

DESCRIPTION
  This script build foglamp-gui distribution artifacts 

OPTIONS
  Multiple commands can be specified but they all must be
  specified separately (-hv is not supported).

  -h, --help     Display this help text
  -v, --version  Display this script's version information

EXIT STATUS
  This script exits with status code 1 when errors occur.

EXAMPLES
  sh $0 --version"

#########################
# functions def
#########################

remove_unwanted_files () {
    rm -rf dist/assets
    rm dist/*.eot 
    rm dist/*.svg
    rm dist/*.woff2
    rm dist/*.woff
    # if built on mac
    rm -rf .DS_Store
}

show_files_with_size () {
    for f in dist/*.bundle*; do
        FILE_SIZE=$(du -h "$f")
        echo "${FILE_SIZE}"
    done
}

build () {
    
    echo -e  INFO: "${CINFO} Cleaning the dependencies ... ${CRESET}"
    yarn clean

    echo -e  INFO: "${CINFO} Adding dependencies ... ${CRESET}"
    yarn install

    echo -e  INFO: "${CINFO} Creating production build ... ${CRESET}"
    yarn build

    echo -e INFO: "${CINFO} Build distribution contents  ... ${CRESET}"
    show_files_with_size

    T_SIZE=$(du -hs dist)
    echo -e INFO " ${CWARN} Size: ${T_SIZE} ${CRESET}" 

    echo -e INFO: "${CINFO} Removing unwanted contents ... ${CRESET}"
    remove_unwanted_files

    T_SIZE=$(du -hs dist)
    echo -e INFO: "${CINFO} Deployable dist size ${CWARN}  ${T_SIZE} ${CRESET}" 

    RELEASBLE_BUILD="foglamp-gui-${__version__}.tar.gz"
    echo -e  INFO: "${CINFO} Creating compressed build artifacts for release ... ${CRESET}"
    tar -zcvf ${RELEASBLE_BUILD} dist &>/dev/null
    echo "Created ${RELEASBLE_BUILD}"
    echo -e INFO: "${CINFO} Done. ${CRESET}"

}

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

  elif [ "$OPTION" == "START" ]
  then
    build

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
  OPTION="START"
  execute_command
fi
