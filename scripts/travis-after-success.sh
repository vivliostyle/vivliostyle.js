#!/bin/bash
set -ev

if [ "${TRAVIS_PULL_REQUEST}" = "false" -a "${TRAVIS_BRANCH}" = "master" ]; then
    version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')
    if [ $(echo ${version} | grep -- '-pre$') ]; then
        scripts/make-dist-packages.sh ${version}.$(date -u "+%Y%m%d%H%M%S")
    fi

    scripts/deploy-viewer-to-gh-pages.sh
fi
