#!/bin/bash
set -ev

version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')
if [ $(echo ${version} | grep -- '-pre$') ]; then
    version=${version}.$(date -u "+%Y%m%d%H%M%S")
    npm --no-git-tag-version version ${version}
fi
