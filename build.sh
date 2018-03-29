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
  -c, --clean    Clean and build dependencies
  --clean-start


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

compress_bundle_js_files () {
    gzip --keep dist/*.bundle.js
}

show_files_with_size () {
    for f in dist/*.*; do
        FILE_SIZE=$(du -h "$f")
        echo "${FILE_SIZE}"
    done
}

clean(){
  echo -e  INFO: "${CINFO} Cleaning the build and dependencies ... ${CRESET}"
  yarn clean
}

build () {
  echo -e  INFO: "${CINFO} Installing dependencies ... ${CRESET}"
  yarn install
  
  echo -e  INFO: "${CINFO} Creating production build ... ${CRESET}"
  yarn build

  echo -e INFO: "${CINFO} Build distribution contents  ... ${CRESET}"
  show_files_with_size

  T_SIZE=$(du -hs dist)
  echo -e INFO " ${CWARN} Size: ${T_SIZE} ${CRESET}" 

  echo -e INFO: "${CINFO} Removing unwanted contents ... ${CRESET}"
  remove_unwanted_files

  # echo "Compressing ..."
  # compress_bundle_js_files

  T_SIZE=$(du -hs dist)
  echo -e INFO: "${CINFO} Deployable dist size ${CWARN}  ${T_SIZE} ${CRESET}" 

  RELEASABLE_BUILD="foglamp-gui-${__version__}.tar.gz"
  echo -e  INFO: "${CINFO} Creating compressed build artifacts for release ... ${CRESET}"
  tar -zcvf ${RELEASABLE_BUILD} dist &>/dev/null
  echo "Created ${RELEASABLE_BUILD}"
  echo -e INFO: "${CINFO} Done. ${CRESET}"
}

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
  
  elif [[ "$OPTION" == "CLEAN" ]]
  then
    clean
  
  elif [[ "$OPTION" == "CLEAN_START" ]]
  then
    clean
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

      -c|--clean)
        OPTION="CLEAN"
      ;;

      --clean-start)
        OPTION="CLEAN_START"
      ;;

      *)
        echo "Unrecognized option: $i"
    esac
    execute_command
  done
else
  build
fi
