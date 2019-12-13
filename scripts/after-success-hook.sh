#!/bin/bash
set -ev

if [ "${TRAVIS_PULL_REQUEST}" = "false" -a \( "${TRAVIS_BRANCH}" = "master" -o "${TRAVIS_TAG}" != "" \) ]; then
    # publish canary packages
    scripts/publish-canary-packages.sh

    # deploy Vivliostyle Viewer to GitHub Pages
    scripts/make-viewer-zip.sh ${version}
    scripts/deploy-viewer.sh
fi
