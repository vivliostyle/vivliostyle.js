#!/bin/bash
set -ev

if [ "${TRAVIS_PULL_REQUEST}" = "false" -a \( "${TRAVIS_BRANCH}" = "master" -o "${TRAVIS_TAG}" != "" \) ]; then
    build/npm-publish.sh
    build/deploy-viewer-to-gh-pages.sh
fi
