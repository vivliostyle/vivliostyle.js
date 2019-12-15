#!/bin/bash
set -ev

# publish to npm
echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > ~/.npmrc

lerna publish --canary
