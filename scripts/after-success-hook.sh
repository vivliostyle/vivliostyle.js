#!/bin/bash
set -eo pipefail

if [ "${TRAVIS_PULL_REQUEST}" = "false" ] && [[ ${TRAVIS_TAG} =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9._]+)?$ ]]; then
    TAGGED_RELEASE=true
else
    TAGGED_RELEASE=false
fi
if [[ ${TRAVIS_TAG} =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    STABLE_RELEASE=true
else
    STABLE_RELEASE=false
fi
if [[ ${TRAVIS_TAG} =~ ^v[0-9]+\.[0-9]+\.[0-9]+-[a-zA-Z0-9._]+$ ]]; then
    PRE_RELEASE=true
else
    PRE_RELEASE=false
fi

echo "===> TAGGED_RELEASE=${TAGGED_RELEASE}"
echo "===> STABLE_RELEASE=${STABLE_RELEASE}"
echo "===> PRE_RELEASE=${PRE_RELEASE}"

# if stable or pre-release tag push
if [[ $TAGGED_RELEASE = true ]]; then
    echo "===> Configuring credentials"
    git config user.email "travis@travis-ci.org"
    git config user.name "Travis CI"
    echo -e "$GITHUB_DEPLOY_KEY" | base64 -d > ~/.ssh/deploy.key
    echo -e "$GITHUB_DEPLOY_KEY_VIVLIOSTYLE_ORG" | base64 -d > ~/.ssh/deploy-vivliostyle-org.key
    echo -e "$GITHUB_DEPLOY_KEY_VIVLIOSTYLE_GITHUB_IO" | base64 -d > ~/.ssh/deploy-vivliostyle-github-io.key
    chmod 600 ~/.ssh/deploy.key
    chmod 600 ~/.ssh/deploy-vivliostyle-org.key
    chmod 600 ~/.ssh/deploy-vivliostyle-github-io.key
    echo -e "Host github.com\n\tStrictHostKeyChecking no\nHostName github.com\nIdentityFile ~/.ssh/deploy.key\n" >> ~/.ssh/config
    echo -e "Host github-vivliostyle-org\n\tStrictHostKeyChecking no\nHostName github.com\nIdentityFile ~/.ssh/deploy-vivliostyle-org.key\n" >> ~/.ssh/config
    echo -e "Host github-vivliostyle-github-io\n\tStrictHostKeyChecking no\nHostName github.com\nIdentityFile ~/.ssh/deploy-vivliostyle-github-io.key\n" >> ~/.ssh/config

    ARCHIVE_DIR="vivliostyle"
    ARCHIVE_PATH="vivliostyle.zip"
    VIEWER_ARTIFACTS=packages/viewer/lib/*
    echo "===> ARCHIVE_DIR=${ARCHIVE_DIR}"
    echo "===> ARCHIVE_PATH=${ARCHIVE_PATH}"
    echo "===> VIEWER_ARTIFACTS=${VIEWER_ARTIFACTS}"

    # generate archive
    echo "===> Generating Viewer Archive"
    scripts/generate-viewer-archive.sh "${ARCHIVE_DIR}" "${ARCHIVE_PATH}"

    # fetch vivliostyle.github.io
    echo "===> Cloning vivliostyle.github.io"
    # git clone -q --depth=1 --branch=master git@github.com:vivliostyle/vivliostyle.github.io.git vivliostyle.github.io
    git clone -q --depth=1 --branch=master git@github-vivliostyle-github-io:vivliostyle/vivliostyle.github.io.git vivliostyle.github.io

    # copy canary viewer to vivliostyle.github.io
    echo "===> Copying viewer to vivliostyle.github.io/viewer"
    CANARY_VIEWER_ROOT="vivliostyle.github.io/viewer"
    mkdir -p "${CANARY_VIEWER_ROOT}"
    cp -R ${VIEWER_ARTIFACTS} "${CANARY_VIEWER_ROOT}/"
    cp -R "${ARCHIVE_PATH}" "${CANARY_VIEWER_ROOT}/vivliostyle-canary.zip"

    # publish to npm
    echo "===> Publishing packages in npm"
    echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > ~/.npmrc
    if [[ $STABLE_RELEASE = true ]]; then
        yarn ship --yes
    else
        yarn ship --yes --dist-tag next
    fi
    
    # GitHub releases
    echo "===> Creating GitHub Release"
    npm i -g conventional-changelog-cli github-release-cli
    CHANGELOG=$(conventional-changelog -p angular)
    echo "===> CHANGELOG=${CHANGELOG}"
    github-release upload \
        --token "${GH_TOKEN}" \
        --owner vivliostyle \
        --repo vivliostyle \
        --tag "${TRAVIS_TAG}" \
        --name "${TRAVIS_TAG}" \
        --body "${CHANGELOG}" \
        ${ARCHIVE_PATH}

    # if stable release (v2.0.0, v3.10.100, ...)
    if [[ $STABLE_RELEASE = true ]]; then
        VERSION=$(echo ${TRAVIS_TAG} | sed 's/^v\(.*\)/\1/')
        TAGGED_VIEWER_ROOT="vivliostyle.github.io/viewer/${TRAVIS_TAG}"
        echo "===> VERSION=${VERSION} TAGGED_VIEWER_ROOT=${TAGGED_VIEWER_ROOT}"

        echo "===> Copying viewer to ${TAGGED_VIEWER_ROOT}"
        mkdir -p ${TAGGED_VIEWER_ROOT}
        cp -R ${VIEWER_ARTIFACTS} "${TAGGED_VIEWER_ROOT}/"
        echo "${TRAVIS_TAG},${VERSION}" >> vivliostyle.github.io/_data/releases.csv

        echo "===> Copying viewer to vivliostyle.org/viewer"
        # git clone -q --depth=1 --branch=master git@github.com:vivliostyle/vivliostyle.org.git vivliostyle.org
        git clone -q --depth=1 --branch=master git@github-vivliostyle-org:vivliostyle/vivliostyle.org.git vivliostyle.org
        mkdir -p vivliostyle.org/viewer
        cp -R ${VIEWER_ARTIFACTS} vivliostyle.org/viewer/
        cp -R ${ARCHIVE_PATH} vivliostyle.org/viewer/vivliostyle-latest.zip
        mkdir -p vivliostyle.org/docs/user-guide/
        cp -R docs/user-guide/* vivliostyle.org/docs/user-guide/
        cp    docs/supported-features.md vivliostyle.org/docs/

        echo "===> Pushing changes to vivliostyle.org"
        cd vivliostyle.org
        git add .
        git status
        git commit -m "Update Vivliostyle latest release (original commit: $TRAVIS_COMMIT)"
        git push origin master
        cd ..
    fi

    echo "===> Pushing changes to vivliostyle.github.io"
    cd vivliostyle.github.io
    git add .
    git status
    git commit -m "Update Vivliostyle pre-release (original commit: $TRAVIS_COMMIT)"
    git push origin master
    cd ..

    echo "===> Cleaning up"
    rm -rf vivliostyle.github.io vivliostyle.org
fi
