#!/bin/bash
  

for file in `\find . -maxdepth 1 -type d -name 'backup*'`; do
  ## delete by name 1 week ago dirs
  datetime="${file##*/backup_}"
  datetime="${datetime//-//}"
  datetime="${datetime//./:}"
  datetime="${datetime//_/ }"
  #compare= $(( $(date -d "$datetime" +%s) - $(date -d '1 week ago' +%s) ))
  if [ $(date -d '1 day ago' +%s) -gt $(date -d "$datetime" +%s) ] ; then
    echo "remove" + $file
    rm -rf $file
  fi
done
