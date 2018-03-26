#!/bin/sh

#########################
# functions def
#########################

remove_unwanted_files () {
    rm -rf dist/assets
    rm dist/*.eot 
    rm dist/*.svg
    rm dist/*.woff2
    rm dist/*.woff
}

show_files_with_size () {
    for f in dist/*.bundle*; do
        FILE_SIZE=$(du -ch "$f")
        echo "${FILE_SIZE} \n"
    done
}
#########################
# variables 
#########################

echo $0 

echo cleaning the depdencies ...
yarn clean

echo adding dependencies ...
yarn install

echo creating production build ...
yarn build

T_SIZE=$(du -hcs dist)
echo "Size before removal of unwated files: \n ${T_SIZE}" 

remove_unwanted_files
show_files_with_size

T_SIZE=$(du -hcs dist)
echo "Size \n ${T_SIZE}" 
