#!/bin/bash
set -ev

if [ "${TRAVIS_PULL_REQUEST}" = "false" -a \( "${TRAVIS_BRANCH}" = "master" -o "${TRAVIS_TAG}" != "" \) ]; then
    # build documents
    scripts/build-documents.sh

    # publish to npm
    scripts/publish-packages.sh

    # make zip archive
    scripts/make-viewer-zip.sh ${version}

    # deploy to gh-pages
    scripts/deploy-viewer.sh
fi
