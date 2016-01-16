#!/bin/bash
set -ev

if [ "${TRAVIS_PULL_REQUEST}" = "false" -a \( "${TRAVIS_BRANCH}" = "master" -o "${TRAVIS_TAG}" != "" \) ]; then
    # build documents
    gem install kramdown
    kramdown --no-auto-ids -i GFM --template doc/supported-features.erb doc/supported-features.md > doc/supported-features.html

    build/npm-publish.sh
    build/deploy-viewer-to-gh-pages.sh
fi
