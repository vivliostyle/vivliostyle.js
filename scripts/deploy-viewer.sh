#!/bin/bash
set -ev

# git config
git config user.email "murakami@vivliostyle.org"
git config user.name "MurakamiShinyu (Travis CI)"

# setup ssh key
echo -e "Host github.com\n\tStrictHostKeyChecking no\nIdentityFile ~/.ssh/deploy.key\n" >> ~/.ssh/config
echo -e "$GITHUB_DEPLOY_KEY" | base64 -d > ~/.ssh/deploy.key
chmod 600 ~/.ssh/deploy.key

# move on parent
cd ../

# fetch and build vivliostyle
git clone --depth=1 --branch=master git@github.com:vivliostyle/vivliostyle.git vivliostyle
cd vivliostyle

yarn install
yarn build
# yarn test-sauce

# make self-contained package
version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)",$/\1/' | sed -e 's/\.0$//')
scripts/make-viewer-zip.sh ${version}

# move on parent
cd ../

# fetch gh-pages
git clone --depth=1 --branch=gh-pages git@github.com:vivliostyle/vivliostyle.git gh-pages
cd gh-pages

# copy resources to gh-pages
cp -R ../vivliostyle/packages/viewer/pages/*                        .
cp -R ../vivliostyle/packages/viewer/lib/*                          viewer/
cp    ../vivliostyle/packages/core/doc/supported-features.{md,html} docs/en/

zip="../vivliostyle/vivliostyle-js-latest.zip"
if [ -e ${zip} ]; then
    mv ${zip} downloads/
fi

git add .
git status
git commit -m "Update vivliostyle (original commit: $TRAVIS_COMMIT)"
git push origin gh-pages
