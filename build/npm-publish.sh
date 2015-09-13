#!/bin/bash
set -ev

# publish to npm
version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')
if [ $(echo ${version} | grep -- '-pre$') ]; then
    echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > ~/.npmrc
    npm --no-git-tag-version version ${version}.$(date -u "+%Y%m%d%H%M%S")
    npm publish --tag next
fi
