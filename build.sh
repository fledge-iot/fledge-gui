#!/bin/sh
VERSION='1.2.0'
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
#########################
# variables 
#########################

echo $0 

echo "Cleaning the dependencies ..."
yarn clean

echo "Adding dependencies ..."
yarn install

echo "Creating production build ..."
yarn build

echo "Build distribution contents  ..."
show_files_with_size

T_SIZE=$(du -hs dist)
echo "Size: ${T_SIZE}" 

echo "Removing unwanted contents ..."
remove_unwanted_files

T_SIZE=$(du -hs dist)
echo "Deployable dist size ${T_SIZE}" 

RELEASBLE_BUILD="foglamp-gui-${VERSION}.tar.gz"
echo "Creating compressed build artifacts for release ..." 
tar -zcvf ${RELEASBLE_BUILD} dist &>/dev/null
echo "Created ${RELEASBLE_BUILD}"
echo "Done."
