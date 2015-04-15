#!/bin/bash
set -ev

if [ "${TRAVIS_PULL_REQUEST}" = "false" -a "${TRAVIS_BRANCH}" = "master" ]; then
    # setup ssh key
    echo -e "Host github.com\n\tStrictHostKeyChecking no\nIdentityFile ~/.ssh/deploy.key\n" >> ~/.ssh/config
    echo -e "$GITHUB_DEPLOY_KEY" | base64 -d > ~/.ssh/deploy.key
    chmod 600 ~/.ssh/deploy.key

    # fetch gh-pages branch
    cd ../..
    git clone --depth=1 --branch=gh-pages git@github.com:vivliostyle/vivliostyle.js.git gh-pages
    cd gh-pages

    # git configuration
    git config user.email "kwkbtr@vivliostyle.com"
    git config user.name "kwkbtr (Travis CI)"

    # update gh-pages branch
    master=../vivliostyle/vivliostyle.js
    cp ${master}/build/vivliostyle-viewer.min.js ${master}/src/adapt/*.{css,txt,xml} ${master}/src/vivliostyle/*.css viewer/
    git add viewer
    git commit -m "Update built vivliostyle-viewer.min.js (original commit: $TRAVIS_COMMIT)"
    git push origin gh-pages
fi
