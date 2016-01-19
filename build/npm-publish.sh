#!/bin/bash
set -ev

# publish to npm
version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')
echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > ~/.npmrc
if [ $(echo ${version} | grep -- '-pre') ]; then
    npm publish --tag next
elif [ "${TRAVIS_TAG}" != "" ]; then
    npm publish
fi
