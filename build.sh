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
    arr=(dist/*.*)
    for f in "${arr[@]}"; do
        echo "$f"
        FILE_NAME="$f"
        FILE_SIZE=$(wc -c <"$FILE_NAME")
        echo "Size of $FILE_NAME = $FILE_SIZE bytes."
    done
}
#########################
# variables 
#########################

echo $0 

echo cleaning the depdencies ...
yarn clean

echo add dependencies
yarn install

echo production build
yarn build

T_SIZE=$(du -hcs dist)
echo "Size before removal of unwated files: \n ${T_SIZE}" 

remove_unwanted_files
# show_files_with_size

T_SIZE=$(du -hcs dist)
echo "Size \n ${T_SIZE}" 
