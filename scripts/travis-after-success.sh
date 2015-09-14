#!/bin/bash
set -ev

if [ "${TRAVIS_PULL_REQUEST}" = "false" -a "${TRAVIS_BRANCH}" = "master" ]; then
    version=$(grep '^ *"version":' node_modules/vivliostyle/package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')
    scripts/make-dist-package.sh ${version}

    scripts/deploy-viewer-to-gh-pages.sh
fi
