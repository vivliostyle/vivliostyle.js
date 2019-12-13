#!/bin/bash
set -ev

# TODO: publish via `lerna`

version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')

# publish to npm
echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > ~/.npmrc
if [ $(echo ${version} | grep -- '-pre') ]; then
    #npm publish --tag next
    echo "npm publish --tag next"
elif [ "${TRAVIS_TAG}" != "" ]; then
    #npm publish
    echo "npm publish"
fi
