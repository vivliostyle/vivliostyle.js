#!/bin/bash
set -ev

if [ "${TRAVIS_PULL_REQUEST}" = "false" -a \( "${TRAVIS_BRANCH}" = "master" -o "${TRAVIS_TAG}" != "" \) ]; then
    # build documents
    gem install kramdown
    src="doc/supported-features.md"
    template=doc/supported-features.erb
    version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')
    if [ $(echo ${version} | grep -- '-pre') ]; then
        sed -i -e "s/<%= \$version %>//" ${src} ${template}
    else
        sed -i -e "s/<%= \$version %>/ ${version}/" ${src} ${template}
    fi
    kramdown --no-auto-ids -i GFM --template ${template} ${src} > doc/supported-features.html

    build/npm-publish.sh
    build/deploy-viewer-to-gh-pages.sh
fi
